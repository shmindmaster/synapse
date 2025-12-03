# Synapse Demo Users

## Master Account

- **Email**: `demomaster@pendoah.ai`
- **Password**: `Pendoah1225`
- **Role**: ADMIN
- **Description**: Master Demo Account with full administrative access

## Role-Based Demo Users

### Knowledge User
- **Email**: `user@pendoah.ai`
- **Password**: `Pendoah1225`
- **Role**: USER
- **Name**: Knowledge User
- **Description**: Standard knowledge management access

### Team Collaborator
- **Email**: `team@pendoah.ai`
- **Password**: `Pendoah1225`
- **Role**: TEAM
- **Name**: Team Collaborator
- **Description**: Team collaboration features

### Admin User
- **Email**: `admin@pendoah.ai`
- **Password**: `Pendoah1225`
- **Role**: ADMIN
- **Name**: Admin User
- **Description**: Full administrative access

## Notes

All demo users use the same password: `Pendoah1225`

Authentication is handled via the `/api/auth/login` endpoint in `apps/backend/server.js`.
