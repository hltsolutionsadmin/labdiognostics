import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSignalService } from '../data-access/auth-signal.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthSignalService);
  if (auth.isAuthed()) return true;
  return inject(Router).createUrlTree(['/auth/login']);
};
