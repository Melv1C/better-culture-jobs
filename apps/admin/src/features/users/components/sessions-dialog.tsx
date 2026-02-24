import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from '@melv1c/ui-core';
import { AlertCircle, Clock, Globe, Loader2, Monitor, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../constants';
import { useRevokeAllSessions, useRevokeSession, useUserSessions, useUsers } from '../use-users';
import { useUsersStore } from '../users-store';

export function SessionsDialog() {
  const isOpen = useUsersStore(state => state.sessionsDialogOpen);
  const closeDialog = useUsersStore(state => state.closeSessionsDialog);
  const selectedUserId = useUsersStore(state => state.selectedUserId);
  const filter = useUsersStore(state => state.filter);

  const { data: usersData } = useUsers(filter);
  const user = usersData?.users.find(u => u.id === selectedUserId);

  const { data: sessions, isPending, isError } = useUserSessions(selectedUserId);
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();

  const handleRevokeAll = async () => {
    if (!selectedUserId) return;
    await revokeAllSessions.mutateAsync(selectedUserId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && closeDialog()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Sessions</DialogTitle>
          <DialogDescription>
            Active sessions for <strong>{user?.name ?? 'this user'}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-8 text-destructive gap-2">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">Failed to load sessions</p>
            </div>
          )}

          {!isPending && !isError && sessions && sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No active sessions</p>
            </div>
          )}

          {!isPending && !isError && sessions && sessions.length > 0 && (
            <ScrollArea className="h-80">
              <div className="space-y-3 pr-4">
                {sessions.map(session => (
                  <div key={session.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate text-sm">
                            {session.userAgent
                              ? session.userAgent.length > 50
                                ? `${session.userAgent.slice(0, 50)}...`
                                : session.userAgent
                              : 'Unknown device'}
                          </span>
                        </div>
                        {session.ipAddress && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3 shrink-0" />
                            <span>{session.ipAddress}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>Created {formatRelativeTime(session.createdAt)}</span>
                        </div>
                        {session.impersonatedBy && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Impersonated session
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeSession.mutate(session.token)}
                        disabled={revokeSession.isPending}
                        className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Close
          </Button>
          {sessions && sessions.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleRevokeAll}
              disabled={revokeAllSessions.isPending}
            >
              {revokeAllSessions.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke All Sessions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
