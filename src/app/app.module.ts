import { PeerAudioComponent } from './stream/peer-audio/peer-audio.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { FooterComponent } from './footer/footer.component';
import { InviteFormComponent } from './invite-form/invite-form.component';
import {
  InvitationAlreadyAcceptedComponent,
  InvitationsComponent,
} from './invitations/invitations.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID, APP_INITIALIZER } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  DateAdapter,
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher,
} from '@angular/material/core';

import { HttpClientModule } from '@angular/common/http';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './auth/jwt.interceptor';
import { ErrorInterceptor } from './auth/error.interceptor';
import { AuthService } from './auth/auth.service';
import { LoginComponent } from './login/login.component';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './_guards/auth.guard';
import { RouterGuard } from './_guards/router.guard';

import { SharedModule } from './shared.module';

import { VideoRoomComponent } from './video-room/video-room.component';

import { DashboardComponent } from './dashboard/dashboard.component';
import { ConsultationsComponent } from './consultations/consultations.component';
import { ConsultationComponent } from './consultation/consultation.component';
import { TopNavComponent } from './top-nav/top-nav.component';
import { SideChatComponent } from './side-chat/side-chat.component';
import { ChatComponent } from './chat/chat.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ProfileComponent } from './profile/profile.component';
import { TestMediaComponent } from './test-media/test-media.component';
import { SelectLanguageComponent } from './select-language/select-language.component';

import { OverlayComponent } from './overlay/overlay.component';

import { MsgTimePipe } from './msg-time.pipe';
import { DurationPipe } from './duration.pipe';

import { DatePipe, registerLocaleData } from '@angular/common';

import localeFr from '@angular/common/locales/fr';
import localeUk from '@angular/common/locales/uk';
import localeSv from '@angular/common/locales/sv';

import { ProfileUpdateComponent } from './profile-update/profile-update.component';
import { I18nModule } from './i18n/i18n.module';
import { ConfigService } from './core/config.service';

import { HugAngularLibModule } from 'hcw-stream-lib';
import { PeerVideoComponent } from './stream/peer-video/peer-video.component';
import { PlanConsultationComponent } from './plan-consultation/plan-consultation.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { InviteExpertComponent } from './invite-expoert/invite-expert.component';
import { PeerVideoScreenComponent } from './stream/peer-video-screen/peer-video-screen.component';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { DotSpinnerComponent } from './dot-spinner/dot-spinner.component';
import { MarkdownModule } from 'ngx-markdown';
import { TranslateService } from '@ngx-translate/core';
import { DateTimePickerComponent } from './date-time-picker/date-time-picker.component';
import { CustomPaginationComponent } from './custom-pagination/custom-pagination.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CustomDateAdapter } from './date-time-picker/custom-date-adapter';
import { FilterModalComponent } from './filter-modal/filter-modal.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { BadgeComponent } from './badge/badge.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { CguComponent } from './cgu/cgu.component';
import { LanguageSelectorComponent } from './language-selector/language-selector.component';
import { InviteLinkComponent } from './invite-link/invite-link.component';
import { StatusComponent } from './status/status.component';
import { TermsAcceptanceComponent } from './terms-acceptance/terms-acceptance.component';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { StartTourComponent } from './shared/components/start-tour/start-tour.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NoteDialogComponent } from './note-dialog/note-dialog.component';

registerLocaleData(localeFr);
registerLocaleData(localeUk);
registerLocaleData(localeSv);

export function LocaleIdFactory(translateService: TranslateService) {
  return translateService.currentLang || 'en';
}

const routes: Routes = [
  {
    path: '',

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
          title: 'Dashboard',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'invitations',
        component: InvitationsComponent,
        data: {
          title: 'Invitations',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'invitations/:id',
        component: InvitationsComponent,
        data: {
          title: 'Invitations',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'pending-consultations',
        component: ConsultationsComponent,
        data: {
          title: 'Consultations',
          status: 'pending',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'active-consultations',
        component: ConsultationsComponent,
        data: {
          title: 'Consultations',
          status: 'active',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'closed-consultations',
        component: ConsultationsComponent,
        data: {
          title: 'Consultations',
          status: 'closed',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'pending-consultations/:id',
        component: ConsultationComponent,
        data: {
          title: 'Consultations',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'active-consultations/:id',
        component: ConsultationComponent,
        data: {
          title: 'Consultations',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'consultation/:id',
        component: ConsultationComponent,
        data: {
          title: 'Consultations',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: {
          title: 'Profil',
        },
        canActivate: [RouterGuard],
      },
      {
        path: 'test-media',
        component: TestMediaComponent,
        data: {
          title: 'Test son & vidéo',
        },
        canActivate: [RouterGuard],
      },
    ],
    canActivate: [AuthGuard, RouterGuard],
  },
  {
    path: 'cgu',
    component: CguComponent,
    data: {
      title: 'Cgu',
    },
  },
  {
    path: 'terms-acceptance',
    component: TermsAcceptanceComponent,
    data: {
      title: 'Terms Acceptance',
    },
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: {
      title: 'Forgot password',
    },
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    data: {
      title: 'Changer mon mot de passe',
    },
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'plan-consultation',
    component: PlanConsultationComponent,
  },
  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PeerVideoComponent,
    PeerVideoScreenComponent,
    VideoRoomComponent,
    PeerAudioComponent,
    DashboardComponent,
    ConsultationsComponent,
    ConsultationComponent,
    TopNavComponent,
    SideChatComponent,
    MsgTimePipe,
    DurationPipe,
    ChatComponent,
    OverlayComponent,
    InvitationsComponent,
    InviteFormComponent,
    InviteExpertComponent,
    InvitationAlreadyAcceptedComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ProfileComponent,
    FooterComponent,
    TestMediaComponent,
    ProfileUpdateComponent,
    SelectLanguageComponent,
    LanguageSelectorComponent,
    ConfirmationDialogComponent,
    PlanConsultationComponent,
    ErrorDialogComponent,
    DotSpinnerComponent,
    DateTimePickerComponent,
    CustomPaginationComponent,
    FilterModalComponent,
    BadgeComponent,
    StatusComponent,
    CguComponent,
    TermsAcceptanceComponent,
    InviteLinkComponent,
    StartTourComponent,
    NoteDialogComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    SharedModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    I18nModule,
    HugAngularLibModule,
    ClipboardModule,
    DragDropModule,
    MarkdownModule.forRoot(),
    MatAutocompleteModule,
    MatExpansionModule,
    MatChipsModule,
    MatTabsModule,
    MatRadioModule,
    TourMatMenuModule,
    MatTooltip,
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: ErrorStateMatcher,
      useClass: ShowOnDirtyErrorStateMatcher,
    },
    {
      provide: LOCALE_ID,
      deps: [TranslateService],
      useFactory: LocaleIdFactory,
    },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    DatePipe,
    ConfigService,
    DurationPipe,
    {
      provide: APP_INITIALIZER,
      useFactory: (cs: ConfigService) => () => cs.getConfig(),
      deps: [ConfigService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
