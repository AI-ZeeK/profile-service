# Staff Invitation Email Setup - Next Steps

## ✅ Completed

1. **Proto Definition** - Added `SendStaffInvitationMail` RPC to communication.proto
2. **Profile Service** - Updated to use new invitation email method
3. **Dependencies** - Added OrganizationsService for company details

## 📋 TODO

### 1. Regenerate Proto Contracts

```bash
cd backend/djengo-proto-contracts
npm run generate
# or
yarn generate
```

This will regenerate TypeScript types for all services.

### 2. Update Communication Service (C#)

Add the gRPC endpoint to handle staff invitation emails.

**File:** `backend/comms/src/mail/MailGrpcService.cs` (or similar)

```csharp
public override async Task<SendStaffInvitationMailResponse> SendStaffInvitationMail(
    SendStaffInvitationMailRequest request,
    ServerCallContext context)
{
    try
    {
        var emailBody = GenerateStaffInvitationEmail(
            companyName: request.CompanyName,
            roleName: request.RoleName,
            branchName: request.BranchName,
            departmentName: request.DepartmentName,
            invitedByName: request.InvitedByName,
            invitationUrl: request.InvitationUrl,
            expiresAt: request.ExpiresAt
        );

        await _mailService.SendEmailAsync(
            to: request.Email,
            subject: $"You're invited to join {request.CompanyName}",
            body: emailBody,
            isHtml: true
        );

        return new SendStaffInvitationMailResponse
        {
            Success = true,
            Email = request.Email
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to send staff invitation email");
        return new SendStaffInvitationMailResponse
        {
            Success = false,
            Error = ex.Message,
            Email = request.Email
        };
    }
}

private string GenerateStaffInvitationEmail(
    string companyName,
    string roleName,
    string? branchName,
    string? departmentName,
    string invitedByName,
    string invitationUrl,
    string expiresAt)
{
    var expiryDate = DateTime.Parse(expiresAt);
    var timeLeft = expiryDate.ToString("MMM dd, yyyy 'at' h:mm tt");

    var departmentInfo = !string.IsNullOrEmpty(departmentName)
        ? $" in the {departmentName} department"
        : "";

    var branchInfo = !string.IsNullOrEmpty(branchName)
        ? $" at {branchName}"
        : "";

    return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .details {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 You're Invited!</h1>
        </div>
        <div class='content'>
            <p>Hi there,</p>
            <p><strong>{invitedByName}</strong> has invited you to join <strong>{companyName}</strong> as a <strong>{roleName}</strong>{departmentInfo}{branchInfo}.</p>

            <div class='details'>
                <h3>Invitation Details:</h3>
                <ul>
                    <li><strong>Company:</strong> {companyName}</li>
                    <li><strong>Role:</strong> {roleName}</li>
                    {(!string.IsNullOrEmpty(branchName) ? $"<li><strong>Branch:</strong> {branchName}</li>" : "")}
                    {(!string.IsNullOrEmpty(departmentName) ? $"<li><strong>Department:</strong> {departmentName}</li>" : "")}
                    <li><strong>Invited by:</strong> {invitedByName}</li>
                    <li><strong>Expires:</strong> {timeLeft}</li>
                </ul>
            </div>

            <p>Click the button below to accept this invitation and get started:</p>

            <div style='text-align: center;'>
                <a href='{invitationUrl}' class='button'>Accept Invitation</a>
            </div>

            <p style='color: #666; font-size: 14px;'>
                This invitation will expire in 4 hours. If you don't want to join, you can simply ignore this email.
            </p>

            <p style='color: #999; font-size: 12px;'>
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href='{invitationUrl}'>{invitationUrl}</a>
            </p>
        </div>
        <div class='footer'>
            <p>© {DateTime.Now.Year} Djengo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
";
}
```

### 3. Update Profile Service Proto Imports

After regenerating proto contracts:

```bash
cd backend/profile-service
npm install
# The new types should now be available in communication.pb.ts
```

### 4. Set Environment Variable

Add to `.env` files:

```bash
FRONTEND_URL=http://localhost:3000  # Development
# or
FRONTEND_URL=https://app.djengo.com  # Production
```

### 5. Test the Flow

```bash
# 1. Start communication service (comms)
cd backend/comms
dotnet watch run

# 2. Start profile service
cd backend/profile-service
npm run start:dev

# 3. Test sending invitation
curl -X POST http://localhost:3002/staff/invitations/send \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "uuid",
    "invitedBy": "staff-uuid",
    "invitedByName": "John Manager",
    "companyName": "Tech Corp",
    "invitations": [{
      "email": "newstaff@example.com",
      "roleName": "Developer",
      "branchName": "Main Branch",
      "departmentName": "Engineering"
    }]
  }'
```

## Email Template Preview

The email will include:

- 🎉 Welcome header
- Company name and role details
- Branch/Department (if applicable)
- Who invited them
- Expiration time (4 hours)
- Big "Accept Invitation" button
- Alternative link if button doesn't work
- Professional styling with gradients

## Proto Changes Summary

**Request:**

```proto
message SendStaffInvitationMailRequest {
  string email = 1;
  string invitation_code = 2;
  string company_name = 3;
  string role_name = 4;
  optional string branch_name = 5;
  optional string department_name = 6;
  string invited_by_name = 7;
  string expires_at = 8;
  string invitation_url = 9;
}
```

**Response:**

```proto
message SendStaffInvitationMailResponse {
  bool success = 1;
  optional string error = 2;
  string email = 3;
}
```
