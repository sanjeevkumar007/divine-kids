import { Component } from '@angular/core';
import { HomeComponent } from "./home/home.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  // isAdmin$: Observable<boolean>;
  // isHomeOnly$: Observable<boolean>;
  // isProductRoute$: Observable<boolean>;
  // isCategoriesOnly$: Observable<boolean>;
  // showMarketing$: Observable<boolean>; // true => show new-info + slider
  // isAuthRoute$: Observable<boolean>;
  // showChrome$: Observable<boolean>;

  // constructor(private router: Router) {
  //   const url$ = this.router.events.pipe(
  //     filter((e): e is NavigationEnd => e instanceof NavigationEnd),
  //     map(e => e.urlAfterRedirects),
  //     startWith(this.router.url)
  //   );

  //   // use precise prefixes
  //   this.isAdmin$ = url$.pipe(map(u => /^\/admin(\/|$)/.test(u)), shareReplay(1));
  //   this.isProductRoute$ = url$.pipe(map(u => /^\/product(\/|$)/.test(u)), shareReplay(1));
  //   this.isCategoriesOnly$ = url$.pipe(
  //     map(u => /^\/category(\/|$)/.test(u) || /^\/categories-only(\/|$)/.test(u)),
  //     shareReplay(1)
  //   );
  //   this.isHomeOnly$ = url$.pipe(map(u => u === '/' || /^\/home(\/|$)/.test(u)), shareReplay(1));

  //   // show marketing only when NOT admin, NOT product, NOT categories-only
  //   this.showMarketing$ = combineLatest([this.isAdmin$, this.isProductRoute$, this.isCategoriesOnly$]).pipe(
  //     map(([isAdmin, isProduct, isCats]) => !(isAdmin || isProduct || isCats)),
  //     shareReplay(1)
  //   );

  //   this.isAuthRoute$ = this.router.events.pipe(
  //     filter(e => e instanceof NavigationEnd),
  //     map(() => this.router.url.startsWith('/auth')),
  //     startWith(this.router.url.startsWith('/auth')),
  //     shareReplay(1)
  //   );

  //   this.showChrome$ = combineLatest([this.isAdmin$, this.isAuthRoute$]).pipe(
  //     map(([isAdmin, isAuth]) => !isAdmin && !isAuth),
  //     shareReplay(1)
  //   );
  // }
}