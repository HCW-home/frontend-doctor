import {Injectable} from "@angular/core";
import {Observable, BehaviorSubject,} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {tap, map, first} from "rxjs/operators";
import {SocketEventsService} from "./socket-events.service";
import {Router} from "@angular/router";

@Injectable({
    providedIn: "root",
})
export class ConsultationService {
    public consultationsOverview: Array<any> = [];
    unreadActiveSub: BehaviorSubject<number> = new BehaviorSubject(
        this.unreadSum("active")
    );
    unreadPendingSub: BehaviorSubject<number> = new BehaviorSubject(
        this.unreadSum("pending")
    );
    unreadClosedSub: BehaviorSubject<number> = new BehaviorSubject(
        this.unreadSum("closed")
    );

    currentUser;
    initialized = false;
    consultationsOverviewSub: BehaviorSubject<any[]> = new BehaviorSubject(
        this.consultationsOverview
    );

    constructor(
        private http: HttpClient,
        private socketEventsService: SocketEventsService,
        private router: Router
    ) // private authService: AuthService
    {
    }

    init(currentUser) {
        if (this.initialized) {
            return;
        }
        this.currentUser = currentUser;
        this.socketEventsService.onConsultationClosed().subscribe((event) => {
            const consultation = this.consultationsOverview.find(
                (c) => c._id === event.data._id
            );
            if (consultation) {
                consultation.consultation.status = "closed";
            }
            this.sortConsultations();
            this.consultationsOverviewSub.next(this.consultationsOverview);
            this.updateUnreadCount();
        });
        this.socketEventsService.onConsultation().subscribe((c) => {
            const existing = this.consultationsOverview.find(
                (consultation) => consultation._id === c.data._id
            );
            if (existing) {
                return;
            }
            this.consultationsOverview.unshift(c.data);
            this.sortConsultations();
            this.consultationsOverviewSub.next(this.consultationsOverview);
            this.updateUnreadCount();
        });

        this.socketEventsService.onMessage().subscribe((msg) => {
            const c = this.consultationsOverview.find(
                (c) => c._id === msg.data.consultation
            );
            c.lastMsg = msg.data;
            c.unreadCount++;
            this.updateUnreadCount();
            this.sortConsultations();
            this.consultationsOverviewSub.next(this.consultationsOverview);
        });

        this.socketEventsService.onConsultationAccepted().subscribe((event) => {
            const consultation = this.consultationsOverview.find(
                (c) => c._id === event.data._id
            );

            if (this.currentUser.id === event.data.consultation.acceptedBy) {
                if (consultation && consultation.consultation.status === "pending") {
                    consultation.consultation.status = "active";
                } else {
                    return;
                }
            } else {
                this.consultationsOverview = this.consultationsOverview.filter(
                    (c) => c._id !== event.data._id
                );
            }

            this.sortConsultations();
            this.consultationsOverviewSub.next(this.consultationsOverview);
            this.updateUnreadCount();
        });

        this.socketEventsService.onConsultationCanceled().subscribe((event) => {
            this.consultationsOverview = this.consultationsOverview.filter(
                (c) => c._id !== event.data._id
            );
            this.sortConsultations();
            this.consultationsOverviewSub.next(this.consultationsOverview);
            this.updateUnreadCount();
        });

        this.loadConsultationOverview().subscribe((c) => {
        });
        this.socketEventsService.onConsultationUpdated().subscribe((eventData) => {
            this.loadConsultationOverview().subscribe((c) => {
            });
        });

        this.socketEventsService.onOnlineStatusChange().subscribe((eventData) => {
            const consultation = this.consultationsOverview.find(
                (c) => c._id === eventData.data._id
            );
            if (consultation) {
                Object.assign(consultation.consultation, eventData.data.consultation);

                this.consultationsOverviewSub.next(this.consultationsOverview);
            }
        });

        this.initialized = true;
    }

    public loadConsultationOverview() {
        return this.http
            .get<any[]>(environment.api + "/consultations-overview")
            .pipe(
                tap((consultations) => {
                    this.consultationsOverview = consultations;
                    this.updateUnreadCount();
                    this.sortConsultations();
                    this.consultationsOverviewSub.next(this.consultationsOverview);
                }),
            ).pipe(first());
    }

    getConsultationsOverview(): BehaviorSubject<any> {
        return this.consultationsOverviewSub;
    }

    getConsultation(id): Observable<any> {
        return this.consultationsOverviewSub.pipe(
            map((cs) => {
                const consultation = cs.find((c) => c._id === id);
                return consultation;
            })
        );
    }

    acceptConsultation(id): Observable<any> {
        return this.http
            .post<any[]>(environment.api + `/consultation/${id}/accept`, null)
            .pipe(
                tap((res) => {
                    const c = this.consultationsOverview.find((c) => c._id === id);

                    if (c) {
                        c.consultation.status = "active";
                        c.doctor = this.currentUser;
                    }
                    this.consultationsOverviewSub.next(this.consultationsOverview);
                    this.updateUnreadCount();
                })
            );
    }

    closeConsultation(id): Observable<any> {
        return this.http
            .post<any[]>(environment.api + `/consultation/${id}/close`, null)
            .pipe(
                tap((res) => {
                    const consultation = this.consultationsOverview.find(
                        (c) => c._id === id
                    );

                    if (consultation) {
                        consultation.consultation.status = "closed";
                        this.sortConsultations();
                        this.consultationsOverviewSub.next(this.consultationsOverview);
                        this.socketEventsService.consultationClosedSubj.next(consultation);
                    }
                })
            );
    }

    closeConsultationFeedback(id) {
        this.consultationsOverview.forEach((c) => {
            if (c._id === id) {
                c.consultation.status = "closed";
                c.consultation.closedAt = Date.now();
            }
        });
        this.consultationsOverviewSub.next(this.consultationsOverview);
        this.updateUnreadCount();
        this.router.navigate([""], {state: {confirmed: true}});
    }

    readMessages(consultationId) {
        return this.http
            .post<any[]>(
                environment.api + `/consultation/${consultationId}/read-messages`,
                {}
            )
            .subscribe((r) => {
                const c = this.consultationsOverview.find(
                    (c) => c._id === consultationId
                );
                c.unreadCount = 0;
                this.updateUnreadCount();
            });
    }

    unreadActiveCount(): BehaviorSubject<number> {
        return this.unreadActiveSub;
    }

    unreadPendingCount(): BehaviorSubject<number> {
        return this.unreadPendingSub;
    }

    unreadClosedCount(): BehaviorSubject<number> {
        return this.unreadClosedSub;
    }

    unreadSum(status) {
        return this.consultationsOverview.reduce((a, b) => {
            return b.consultation.status === status ? a + (b.unreadCount || 0) : a;
        }, 0);
    }

    updateUnreadCount() {
        this.unreadActiveSub.next(this.unreadSum("active"));
        this.unreadPendingSub.next(
            this.consultationsOverview.filter(
                (c) => c.consultation.status === "pending"
            ).length
        );
        this.unreadClosedSub.next(this.unreadSum("closed"));
    }

    sortConsultations() {
        this.consultationsOverview = this.consultationsOverview.sort((b, a) => {
            return (
                (a.lastMsg ? a.lastMsg.createdAt : a.consultation.createdAt) -
                (b.lastMsg ? b.lastMsg.createdAt : b.consultation.createdAt)
            );
        });
    }

    acceptNext() {
        const pending = this.consultationsOverview.filter(
            (c) => c.consultation.status === "pending"
        );
        if (pending[0]) {
            this.acceptConsultation(pending[0]._id).subscribe((res) => {
                this.router.navigate(["/consultation/" + pending[0]._id]);
            });
        }
    }

    postFile(file: File, consultationId): Observable<any> {
        // debugger
        const endpoint =
            environment.api + `/consultation/${consultationId}/upload-file`;
        const formData: FormData = new FormData();
        formData.append("attachment", file, file.name);
        return this.http.post(endpoint, formData, {
            headers: {
                "mime-type": file.type,
                "x-access-token": `${this.currentUser.token}`,
                fileName: encodeURIComponent(file.name),
            },
        });
    }

    sendReport(file, consultationId): Observable<any> {
        const endpoint =
            environment.api + `/consultation/${consultationId}/send-report`;
        const formData: FormData = new FormData();
        formData.append("report", file, "report.pdf");
        return this.http.post(endpoint, formData, {
            headers: {
                "mime-type": "application/pdf",
                "x-access-token": `${this.currentUser.token}`,
                fileName: "report",
            },
        });
    }

    /**
     * Saves the doctor's feedback for a consultation.
     * @param consultationId The ID of the targeted consultation
     * @param rating The selected rating
     * @param comment The doctor's comment
     */
    saveConsultationFeedback(consultationId, rating, comment): Observable<any> {
        return this.http.post<any[]>(
            environment.api + `/consultation/${consultationId}/doctorFeedback`,
            {consultationId, rating, comment}
        );
    }

    sendExpertLink(body): Observable<any> {
        return this.http.post<any[]>(
            environment.api + `/send-expert-link`,
            body
        );
    }

}
