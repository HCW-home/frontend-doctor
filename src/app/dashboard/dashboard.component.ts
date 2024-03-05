import {Component, OnInit, NgZone, OnDestroy} from "@angular/core";
import {ConsultationService} from "../core/consultation.service";
import {Subscription} from "rxjs";
import {InviteFormComponent} from "../invite-form/invite-form.component";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";

@Component({
    selector: "app-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent implements OnInit, OnDestroy {
    chatOpen;
    consultations;
    pendingConsultations;
    activeConsultations;
    pendingConsultationsCount;
    activeConsultationsCount;
    currentConsultation;
    unreadPendingCount = 0;
    unreadActiveCount = 0;

    private overviewSubscription: Subscription;
    private unreadActiveCountSubscription: Subscription;
    private unreadPendingCountSubscription: Subscription;

    constructor(
        private conServ: ConsultationService,
        private router: Router,
        public dialog: MatDialog,
        private zone: NgZone) {
    }

    ngOnInit() {
        this.getConsultationsOverview();
        this.getUnreadCount();
    }

    getConsultationsOverview() {

        this.overviewSubscription = this.conServ.getConsultationsOverview().subscribe(consultations => {

            this.zone.run(() => {
                this.consultations = consultations;
                this.pendingConsultations = consultations.filter(c => {
                    return c.consultation.status === "pending";
                });
                this.pendingConsultationsCount = this.pendingConsultations.length;


                this.pendingConsultations = this.pendingConsultations.slice(0, 5);
                this.activeConsultations = consultations.filter(c => {
                    return c.consultation.status === "active";
                });
                this.activeConsultationsCount = this.activeConsultations.length;

                this.activeConsultations = this.activeConsultations.slice(0, 5);
            });
        });


    }

    getUnreadCount() {


        this.unreadActiveCountSubscription = this.conServ.unreadActiveCount().subscribe(count => {


            this.zone.run(() => {
                this.unreadActiveCount = count;


            });
        });
        this.unreadPendingCountSubscription = this.conServ.unreadPendingCount().subscribe(count => {
            this.zone.run(() => {

                this.unreadPendingCount = count;
            });
        });
    }

    showChat(id) {
        this.currentConsultation = this.consultations.find(c => c._id === id);

        this.chatOpen = true;
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(InviteFormComponent, {
            id: "invite_form_dialog",
            width: "500px",
            height: "700px",
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.router.navigate(['/app/invitations']);
            }

        });
    }

    ngOnDestroy() {

        if (this.overviewSubscription) {
            this.overviewSubscription.unsubscribe();
        }
        if (this.unreadActiveCountSubscription) {
            this.unreadActiveCountSubscription.unsubscribe();
        }
        if (this.unreadPendingCountSubscription) {
            this.unreadPendingCountSubscription.unsubscribe();
        }

    }

    acceptNextConsultation() {
        this.conServ.acceptNext();
    }


}
