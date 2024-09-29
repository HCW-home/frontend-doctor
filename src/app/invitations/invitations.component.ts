import { TranslateService } from '@ngx-translate/core';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { Invitation } from '../Invitation';
import { HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { InviteService } from '../core/invite.service';
import { InviteFormComponent } from '../invite-form/invite-form.component';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { tap, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { InviteLinkComponent } from '../invite-link/invite-link.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-invitations',
  templateUrl: './invitations.component.html',
  styleUrls: ['./invitations.component.scss'],
})
export class InvitationsComponent implements OnInit {
  page = 0;
  name: string;
  loading = false;
  inviteId: string;
  totalCount: number;
  currentInvite: Invitation;
  currentInvites: Invitation[] = [];
  invitations: Observable<Invitation[] | HttpResponse<Invitation[]>> = of([]);

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private activeRoute: ActivatedRoute,
    private inviteService: InviteService
  ) {}

  ngOnInit() {
    this.getInvites(1);
    this.inviteId = this.activeRoute.snapshot.params['id'];
  }

  openDialog(invite?, edit = false): void {
    if (
      (invite && invite.status === 'ACCEPTED') ||
      invite?.translatorRequestInvite?.status === 'ACCEPTED'
    ) {
      this.dialog
        .open(InvitationAlreadyAcceptedComponent, {
          autoFocus: false,
        })
        .afterClosed()
        .subscribe(result => {
          this.router.navigate(['/invitations/']);
        });
      return;
    }
    let data = {};
    if (invite) {
      data = {
        phoneNumber: invite.phoneNumber,
        emailAddress: invite.emailAddress,
        firstName: invite.firstName,
        lastName: invite.lastName,
        gender: invite.gender,
        queue: invite.queue,
        scheduledFor: invite.scheduledFor,
        language: invite.patientLanguage,
        guestContact: invite.guestEmailAddress || invite.guestPhoneNumber,
        patientContact: invite.emailAddress || invite.phoneNumber,
        guestEmailAddress: invite.guestEmailAddress,
        guestPhoneNumber: invite.guestPhoneNumber,
        translationOrganization: invite.translationOrganization,
        edit,
        id: invite.id,
        status: invite.status,
        metadata: invite.metadata,
        inviteObj: invite,
      };
    }
    const dialogRef = this.dialog.open(InviteFormComponent, {
      id: 'invite_form_dialog',
      // width: '500px',
      // height: '700px',
      data,
    });

    dialogRef.afterClosed().subscribe(result => {
      this.router.navigate(['/invitations/']);

      this.getInvites(this.page);
    });
  }

  getInvites(page) {
    this.page = page;
    this.loading = true;
    this.invitations = this.inviteService
      .getInvitations((this.page - 1) * 10, 10)
      .pipe(
        tap(resp => {
          this.totalCount = +(resp as HttpResponse<Invitation[]>).headers.get(
            'X-Total-Count'
          );
          this.loading = false;
          this.currentInvites = (resp as HttpResponse<Invitation[]>).body;
          this.currentInvite = this.currentInvites.find(
            i => i.id === this.inviteId
          );
          if (this.currentInvite) {
            this.openDialog(this.currentInvite, true);
          }
        }),
        map(resp => {
          return (resp as HttpResponse<Invitation[]>).body;
        })
      );
  }

  resendInvite(id) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      id: 'confirmation_dialog',
      data: {
        question: this.translate.instant('invitations.confirmResend'),
        yesText: this.translate.instant('invitations.sendAgain'),
        noText: this.translate.instant('invitations.cancelSendAgain'),
        title: this.translate.instant('invitations.resendConfirmTitle'),
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        const invite = this.currentInvites.find(i => i.id === id);
        invite.resending = true;
        this.inviteService.resendInvite(id).subscribe(res => {
          invite.resending = false;
          if (res?.patientInvite) {
            if (
              !res.patientInvite.emailAddress &&
              !res.patientInvite.phoneNumber &&
              res.patientInvite.patientURL
            ) {
              this.dialog.open(InviteLinkComponent, {
                width: '600px',
                data: { link: res.patientInvite.patientURL },
                autoFocus: false,
              });
            } else {
              this.snackBar.open(
                this.translate.instant('sendInviteLink.sent'),
                'X',
                {
                  verticalPosition: 'top',
                  horizontalPosition: 'right',
                  duration: 2500,
                }
              );
            }
          }

          this.getInvites(this.page);
        });
      }
    });
  }

  revokeInvite(id) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      id: 'confirmation_dialog',

      data: {
        question: this.translate.instant('invitations.confirmRevoke'),
        yesText: this.translate.instant('invitations.revoke'),
        noText: this.translate.instant('invitations.cancelRevoke'),
        title: this.translate.instant('invitations.revokeConfirmTitle'),
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        const invite = this.currentInvites.find(i => i.id === id);

        invite.revoking = true;
        this.inviteService.revokeInvite(id).subscribe(res => {
          invite.revoking = false;
          this.getInvites(this.page);
        });
      }
    });
  }
}
@Component({
  selector: 'app-invitation-already-accepted-dialog',
  templateUrl: 'invitation-already-accepted-dialog.html',
})
export class InvitationAlreadyAcceptedComponent {
  constructor(public translate: TranslateService) {}
}
