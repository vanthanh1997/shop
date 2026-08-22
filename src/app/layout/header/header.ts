import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitch } from '@shared/ui/language-switch';
import { map } from 'rxjs';

export interface NavItem {
  readonly path: string;
  readonly labelKey: string;
  readonly exact: boolean;
}
const NAV_ITEMS: readonly NavItem[] = [{ path: '/', labelKey: 'nav.home', exact: true }];
const MOBILE_QUERY = '(max-width: 1023.98px)';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitch],
  templateUrl: './header.html',
})
export class Header {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);

  protected readonly store = inject(AuthStore);

  protected readonly navItems = NAV_ITEMS;

  protected readonly isMobile = toSignal(
    this.breakpoints.observe(MOBILE_QUERY).pipe(map((state) => state.matches)),
    { initialValue: this.breakpoints.isMatched(MOBILE_QUERY) },
  );

  protected readonly email = computed<string | null>(() => this.store.user()?.email ?? null);

  protected readonly initials = computed<string>(() => {
    const email = this.email();
    if (email === null || email.length === 0) {
      return 'ND';
    }

    const local = email.split('@')[0];
    return local.slice(0, 2).toUpperCase();
  });
  
    protected logout(): void {
    void this.store.logout();
    void this.router.navigateByUrl('/');
  }

}
