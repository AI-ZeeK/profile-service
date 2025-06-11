import { Injectable, Logger } from '@nestjs/common';

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits = new Map<string, CircuitBreakerState>();

  // Configuration
  private readonly failureThreshold = 5;
  private readonly timeout = 30000; // 30 seconds
  private readonly retryTimeout = 60000; // 1 minute

  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const circuit = this.getCircuit(serviceName);

    // Check if circuit is open
    if (circuit.state === 'OPEN') {
      if (Date.now() - circuit.lastFailureTime > this.retryTimeout) {
        circuit.state = 'HALF_OPEN';
        this.logger.log(`Circuit ${serviceName} moved to HALF_OPEN`);
      } else {
        this.logger.warn(`Circuit ${serviceName} is OPEN - using fallback`);
        return this.executeFallback(fallback);
      }
    }

    try {
      const result = await this.executeWithTimeout(operation, this.timeout);

      // Success - reset circuit
      if (circuit.state === 'HALF_OPEN' || circuit.failures > 0) {
        circuit.failures = 0;
        circuit.state = 'CLOSED';
        this.logger.log(`Circuit ${serviceName} reset to CLOSED`);
      }

      return { success: true, data: result };
    } catch (error) {
      return this.handleFailure(serviceName, error, fallback);
    }
  }

  private getCircuit(serviceName: string): CircuitBreakerState {
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
      });
    }
    return this.circuits.get(serviceName)!;
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout),
      ),
    ]);
  }

  private async handleFailure<T>(
    serviceName: string,
    error: any,
    fallback?: () => Promise<T> | T,
  ): Promise<{ success: boolean; data?: T; error: string }> {
    const circuit = this.getCircuit(serviceName);
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.failures >= this.failureThreshold) {
      circuit.state = 'OPEN';
      this.logger.error(
        `Circuit ${serviceName} opened after ${circuit.failures} failures`,
      );
    }

    this.logger.error(`Service ${serviceName} failed:`, error.message);

    if (fallback) {
      try {
        const fallbackResult = await fallback();
        return { success: false, data: fallbackResult, error: error.message };
      } catch (fallbackError) {
        this.logger.error(
          `Fallback failed for ${serviceName}:`,
          fallbackError.message,
        );
      }
    }

    return { success: false, error: error.message };
  }

  private async executeFallback<T>(
    fallback?: () => Promise<T> | T,
  ): Promise<{ success: boolean; data?: T; error: string }> {
    if (fallback) {
      try {
        const result = await fallback();
        return {
          success: false,
          data: result,
          error: 'Service unavailable - used fallback',
        };
      } catch (error) {
        return { success: false, error: 'Service and fallback unavailable' };
      }
    }
    return { success: false, error: 'Service unavailable' };
  }

  // Health check method
  getCircuitStatus(serviceName: string) {
    const circuit = this.circuits.get(serviceName);
    return circuit
      ? {
          service: serviceName,
          state: circuit.state,
          failures: circuit.failures,
          lastFailure: circuit.lastFailureTime
            ? new Date(circuit.lastFailureTime)
            : null,
        }
      : null;
  }

  getAllCircuitStatus() {
    return Array.from(this.circuits.entries()).map(
      ([serviceName, circuit]) => ({
        service: serviceName,
        state: circuit.state,
        failures: circuit.failures,
        lastFailure: circuit.lastFailureTime
          ? new Date(circuit.lastFailureTime)
          : null,
      }),
    );
  }
}
