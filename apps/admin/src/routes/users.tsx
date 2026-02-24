import {
  BanUserDialog,
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
  SessionsDialog,
  SetPasswordDialog,
  UserDetailSheet,
  UsersFilter,
  UsersTable,
} from '@/features/users';
import { createFileRoute } from '@tanstack/react-router';

function UsersPage() {
  return (
    <>
      <UsersFilter />
      <UsersTable />
      <UserDetailSheet />

      {/* Dialogs */}
      <CreateUserDialog />
      <EditUserDialog />
      <SetPasswordDialog />
      <BanUserDialog />
      <DeleteUserDialog />
      <SessionsDialog />
    </>
  );
}

export const Route = createFileRoute('/users')({
  component: UsersPage,
});
