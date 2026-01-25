# Staff Onboarding System

## Overview

Complete staff invitation and onboarding system with email invitations, time-limited codes (4 hours), and status tracking.

## Database Schema

### StaffInvitation Table

```prisma
model StaffInvitation {
  invitation_id   String           @id @default(uuid)
  company_id      String           @db.Uuid
  branch_id       String?          @db.Uuid
  department_id   String?          @db.Uuid
  role_id         String?          @db.Uuid
  email           String           @db.VarChar(255)
  invitation_code String           @unique // 64-char hex token
  status          InvitationStatus @default(PENDING)
  invited_by      String           @db.Uuid // staff_id of inviter
  expires_at      DateTime         // 4 hours from creation
  viewed_at       DateTime?
  accepted_at     DateTime?
  declined_at     DateTime?
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt
}
```

### Status Flow

- **PENDING** → Initial state when invitation is sent
- **VIEWED** → User clicked the invitation link
- **ACCEPTED** → User accepted and staff profile created
- **DECLINED** → User declined the invitation
- **EXPIRED** → 4 hours passed without acceptance

## API Endpoints

### 1. Send Invitations

```http
POST /staff/invitations/send
Content-Type: application/json

{
  "companyId": "uuid",
  "invitedBy": "staff_id_uuid",
  "invitations": [
    {
      "email": "john@example.com",
      "roleId": "uuid",
      "branchId": "uuid",  // optional
      "departmentId": "uuid"  // optional
    }
  ]
}

Response:
{
  "success": true,
  "results": [
    {
      "email": "john@example.com",
      "success": true,
      "message": "Invitation sent successfully",
      "invitationId": "uuid",
      "expiresAt": "2026-01-20T12:00:00Z"
    }
  ]
}
```

### 2. Get Invitation Details

```http
GET /staff/invitations/:code

Response:
{
  "success": true,
  "invitation": {
    "invitation_id": "uuid",
    "email": "john@example.com",
    "company_id": "uuid",
    "status": "PENDING",
    "expires_at": "2026-01-20T12:00:00Z",
    ...
  }
}
```

### 3. Mark as Viewed

```http
PUT /staff/invitations/:code/view

Response:
{
  "success": true,
  "invitation": { ... }
}
```

### 4. Accept Invitation

```http
POST /staff/invitations/:code/accept
Content-Type: application/json

{
  "userId": "uuid"  // From auth/login
}

Response:
{
  "success": true,
  "message": "Invitation accepted successfully",
  "staff": {
    "staff_id": "uuid",
    "user_id": "uuid",
    "company_id": "uuid",
    ...
  }
}
```

### 5. Decline Invitation

```http
POST /staff/invitations/:code/decline

Response:
{
  "success": true,
  "message": "Invitation declined"
}
```

## Frontend Integration

### 1. Admin Sends Invitations (Already Built)

```tsx
// StaffOnboarding.tsx
const handleSend = async () => {
  const response = await fetch('/api/profile/staff/invitations/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId: company.company_id,
      invitedBy: currentStaff.staff_id,
      invitations: pending.map((p) => ({
        email: p.email,
        roleId: p.role,
        branchId: p.branch,
        departmentId: p.department,
      })),
    }),
  });

  const result = await response.json();
  // Handle success/error
};
```

### 2. User Receives Email

Email contains link: `https://app.djengo.com/invite/accept?code={invitation_code}`

### 3. Accept Invitation Page

```tsx
// pages/invite/accept.tsx
const AcceptInvitationPage = () => {
  const { code } = useRouter().query;

  useEffect(() => {
    // Mark as viewed
    fetch(`/api/profile/staff/invitations/${code}/view`, { method: 'PUT' });

    // Get invitation details
    fetch(`/api/profile/staff/invitations/${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.invitation.status === 'EXPIRED') {
          // Show expired message
        }
        // Show company info, role, etc.
      });
  }, [code]);

  const handleAccept = async () => {
    // Check if user exists
    const user = await checkAuth(); // Your auth check

    if (!user) {
      // Redirect to signup with returnUrl
      router.push(`/signup?returnUrl=/invite/accept?code=${code}`);
      return;
    }

    // Accept invitation
    const response = await fetch(
      `/api/profile/staff/invitations/${code}/accept`,
      {
        method: 'POST',
        body: JSON.stringify({ userId: user.user_id }),
      },
    );

    if (response.ok) {
      // Redirect to document upload or dashboard
      router.push('/staff/onboarding/documents');
    }
  };

  const handleDecline = async () => {
    await fetch(`/api/profile/staff/invitations/${code}/decline`, {
      method: 'POST',
    });
    router.push('/');
  };

  return (
    <div>
      <h1>Staff Invitation</h1>
      <p>You've been invited to join {companyName}</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  );
};
```

## Key Features

✅ **Unique secure codes** (64-char hex tokens)
✅ **4-hour expiration** automatically enforced
✅ **Status tracking**: pending → viewed → accepted/declined/expired
✅ **Duplicate prevention**: Can't invite same email twice if pending
✅ **Multiple companies**: One user can accept invitations from different companies
✅ **Email integration**: Sends via communication service
✅ **Timestamps**: tracks when viewed, accepted, or declined

## Migration

Run this to create the table:

```bash
cd backend/profile-service
npx prisma migrate dev --name add_staff_invitations
npx prisma generate
```

## Next Steps

1. ✅ Run migration
2. ✅ Update frontend `StaffOnboarding.tsx` with API call
3. Create invitation acceptance page
4. Create email template for invitations
5. Add document upload page for new staff
6. Add invitation tracking dashboard for admins
