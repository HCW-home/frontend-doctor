import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import {ConsultationService} from '../consultation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  chatOpen;
  consultations;
  pendingConsultations;
  activeConsultations;
  pendingConsultationsCount;
  activeConsultationsCount;
  openConsultations;
  currentConsultation;
  unreadPendingCount = 0;
  unreadActiveCount = 0;

  private overviewSubscription: Subscription;
  private unreadActiveCountSubscription: Subscription;
  private unreadPendingCountSubscription: Subscription;

  constructor(private conServ: ConsultationService  , private zone: NgZone) { }

  ngOnInit() {
    this.getConsultationsOverview();
    this.getUnreadCount();
  }

  getConsultationsOverview() {

    this.overviewSubscription = this.conServ.getConsultationsOverview().subscribe(consultations => {

      this.zone.run(() => {
      this.consultations = consultations;
      this.pendingConsultations = consultations.filter(c => {
        return c.consultation.status === 'pending';
      });
      this.pendingConsultationsCount = this.pendingConsultations.length;


      this.pendingConsultations = this.pendingConsultations.slice(0, 5);
      this.activeConsultations = consultations.filter(c => {
        return c.consultation.status === 'active';
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

ngOnDestroy() {
  console.log('destyoing ');

  if (this.overviewSubscription) {this.overviewSubscription.unsubscribe(); }
  if (this.unreadActiveCountSubscription) {this.unreadActiveCountSubscription.unsubscribe(); }
  if (this.unreadPendingCountSubscription) {this.unreadPendingCountSubscription.unsubscribe(); }

//   this.overviewSubscription.unsubscribe();
// this.unreadActiveCountSubscription.unsubscribe();
// this.unreadPendingCountSubscription.unsubscribe();

}

acceptNextConsultation() {
  this.conServ.acceptNext();
}


}
