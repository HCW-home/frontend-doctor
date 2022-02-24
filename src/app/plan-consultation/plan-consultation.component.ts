import { Component,  OnDestroy, OnInit } from '@angular/core';
import { ConfigService } from '../config.service';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { PlanConsultationService } from '../plan-consultation.service';
import { Subscription, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';
@Component({
  selector: 'app-plan-consultation',
  templateUrl: './plan-consultation.component.html',
  styleUrls: ['./plan-consultation.component.scss']
})
export class PlanConsultationComponent implements OnInit, OnDestroy {

  planConsultationForm: FormGroup;
  public consultation;
  private token: string;
  loading = true;
  success = false;
  subscriptions: Subscription[] = [];
  error: string = null;
  constructor(
    private formBuilder: FormBuilder,
    public configService: ConfigService,
    private planConsultationService: PlanConsultationService,
    private translate: TranslateService
  ) { }



  ngOnInit() {
    this.token = this.GetParam("token");
    console.log('Token ', this.token)
    // if not token show error invalid url

    this.planConsultationForm = this.formBuilder.group({
      delay: [10, [Validators.required, Validators.max(60), Validators.min(1)]],
    });


    // get consultation
    this.subscriptions.push(
      this.planConsultationService.getConsultationFromToken(this.token)
      // .pipe(catchError(this.handleError))
      .subscribe(consultation => {
        console.log('Consultation ', consultation)
      this.consultation = consultation;
      this.loading = false;
      if(consultation.status !== 'pending') {
        this.error = this.translate.instant('planConsultation.alreadyStarted')
      }
      }, err=>{
        this.loading = false;
        this.success = false;
        this.error = this.translate.instant(`planConsultation.${err}`)
      })
    );
    //
  }

  handleSubmit() {

    this.loading = true;

    // accept consultation and send chat message
    this.subscriptions.push(

      this.planConsultationService.planConsultation(this.token, this.consultation.id, this.planConsultationForm.get("delay").value)

      .subscribe(res => {
        console.log('Response ', res)
        this.success = true;
        this.loading = false;
      },err=>{
        this.loading = false;
        this.success = false;
        this.error = this.translate.instant(`planConsultation.${err}`)
      })
    )
  }



  GetParam(name) {
    const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) {
      return '';
    }
    return results[1] || '';
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
