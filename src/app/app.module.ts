import { PeerAudioComponent } from './stream/peer-audio/peer-audio.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { FooterComponent } from './footer/footer.component';
import { InviteFormComponent } from './invite-form/invite-form.component';
import {
  InvitationAlreadyAcceptedComponent,
  InvitationsComponent,
} from './invitations/invitations.component';
import { SupportComponent } from './support/support.component';
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

import { ProfileUpdateComponent } from './profile-update/profile-update.component';
import { TranslatedGenderPipe } from './translated-gender.pipe';
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

registerLocaleData(localeFr);

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
        path: 'support',
        component: SupportComponent,
        data: {
          title: 'Support',
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
    SupportComponent,
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
    TranslatedGenderPipe,
    SelectLanguageComponent,
    ConfirmationDialogComponent,
    PlanConsultationComponent,
    ErrorDialogComponent,
    DotSpinnerComponent,
    DateTimePickerComponent,
    CustomPaginationComponent,
    FilterModalComponent,
    BadgeComponent,
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
