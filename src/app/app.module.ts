import { PeerAudioComponent } from "./stream/peer-audio/peer-audio.component";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";
import { FooterComponent } from "./footer/footer.component";
import { InviteFormComponent } from "./invite-form/invite-form.component";
import {
  InvitationAlreadyAcceptedComponent,
  InvitationsComponent,
} from "./invitations/invitations.component";
import { SupportComponent } from "./support/support.component";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule, LOCALE_ID, APP_INITIALIZER } from "@angular/core";

import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher,
} from "@angular/material/core";

import { HttpClientModule } from "@angular/common/http";

import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { JwtInterceptor } from "./auth/jwt.interceptor";
import { ErrorInterceptor } from "./auth/error.interceptor";
import { AuthService } from "./auth/auth.service";
import { LoginComponent } from "./login/login.component";
import { Routes, RouterModule } from "@angular/router";
import { AuthGuard } from "./_guards/auth.guard";
import { RouterGuard } from "./_guards/router.guard";

import { SharedModule } from "./shared.module";

import { VideoRoomComponent } from "./video-room/video-room.component";

import { DashboardComponent } from "./dashboard/dashboard.component";
import { ConsultationsComponent } from "./consultations/consultations.component";
import { ConsultationComponent } from "./consultation/consultation.component";
import { TopNavComponent } from "./top-nav/top-nav.component";
import { SideChatComponent } from "./side-chat/side-chat.component";
import { ChatComponent } from "./chat/chat.component";
import { ForgotPasswordComponent } from "./forgot-password/forgot-password.component";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { ProfileComponent } from "./profile/profile.component";
import { TestMediaComponent } from "./test-media/test-media.component";
import { SelectLanguageComponent } from "./select-language/select-language.component";

import { OverlayComponent } from "./overlay/overlay.component";

import { MsgTimePipe } from "./msg-time.pipe";
import { DurationPipe } from "./duration.pipe";

import { registerLocaleData } from "@angular/common";

import { NgxPaginationModule } from "ngx-pagination"; // <-- import the module
import {
  OwlDateTimeModule,
  OwlNativeDateTimeModule,
  OwlDateTimeIntl,
} from "ng-pick-datetime";

import localeFr from "@angular/common/locales/fr";

import { DefaultIntl } from "./OwlDefaultIntl";
import { ProfileUpdateComponent } from "./profile-update/profile-update.component";
import { TranslatedGenderPipe } from "./translated-gender.pipe";
import { I18nModule } from "./i18n/i18n.module";
import { ConfigService } from "./config.service";

import { HugAngularLibModule } from "hug-angular-lib";
import { PeerVideoComponent } from "./stream/peer-video/peer-video.component";
import { PlanConsultationComponent } from "./plan-consultation/plan-consultation.component";
import { MarkdownModule } from "ngx-markdown";
registerLocaleData(localeFr);

const routes: Routes = [
  {
    path: "",

    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        component: DashboardComponent,
        data: {
          title: "Dashboard",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "support",
        component: SupportComponent,
        data: {
          title: "Support",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "invitations",
        component: InvitationsComponent,
        data: {
          title: "Invitations",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "invitations/:id",
        component: InvitationsComponent,
        data: {
          title: "Invitations",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "pending-consultations",
        component: ConsultationsComponent,
        data: {
          title: "Consultations",
          status: "pending",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "active-consultations",
        component: ConsultationsComponent,
        data: {
          title: "Consultations",
          status: "active",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "closed-consultations",
        component: ConsultationsComponent,
        data: {
          title: "Consultations",
          status: "closed",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "pending-consultations/:id",
        component: ConsultationComponent,
        data: {
          title: "Consultations",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "active-consultations/:id",
        component: ConsultationComponent,
        data: {
          title: "Consultations",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "consultation/:id",
        component: ConsultationComponent,
        data: {
          title: "Consultations",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "profile",
        component: ProfileComponent,
        data: {
          title: "Profil",
        },
        canActivate: [RouterGuard],
      },
      {
        path: "test-media",
        component: TestMediaComponent,
        data: {
          title: "Test son & vidéo",
        },
        canActivate: [RouterGuard],
      },
    ],
    canActivate: [AuthGuard, RouterGuard],
  },
  {
    path: "forgot-password",
    component: ForgotPasswordComponent,
    data: {
      title: "Forgot password",
    },
  },
  {
    path: "reset-password",
    component: ResetPasswordComponent,
    data: {
      title: "Changer mon mot de passe",
    },
  },
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "plan-consultation",
    component: PlanConsultationComponent,
  },
  { path: "**",
    redirectTo: "/dashboard",
    pathMatch: "full" },
];

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        PeerVideoComponent,
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
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        SharedModule,
        HttpClientModule,
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
        NgxPaginationModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        I18nModule,
        HugAngularLibModule,
        MarkdownModule.forRoot(),
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
            useValue: "fr",
        },
        { provide: OwlDateTimeIntl, useClass: DefaultIntl },
        ConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: (cs: ConfigService) => () => cs.getConfig(),
            deps: [ConfigService],
            multi: true,
        },
        // RoomService,
        // Room2Service
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
