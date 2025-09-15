import { Component,  OnDestroy, OnInit } from '@angular/core';
import { ConfigService } from '../core/config.service';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { PlanConsultationService } from '../core/plan-consultation.service';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-plan-consultation',
  templateUrl: './plan-consultation.component.html',
  styleUrls: ['./plan-consultation.component.scss']
})
export class PlanConsultationComponent implements OnInit, OnDestroy {

  planConsultationForm: UntypedFormGroup;
  public consultation;
  private token: string;
  loading = true;
  success = false;
  subscriptions: Subscription[] = [];
  error: string = null;
  constructor(
    private formBuilder: UntypedFormBuilder,
    public configService: ConfigService,
    private planConsultationService: PlanConsultationService,
    private translate: TranslateService,
    private router: Router,
    private authService: AuthService
  ) { }



  ngOnInit() {
    this.token = this.GetParam("token");
    // if not token show error invalid url

    this.planConsultationForm = this.formBuilder.group({
      delay: [10, [Validators.required, Validators.max(60), Validators.min(1)]],
    });


    // get consultation
    this.subscriptions.push(
      this.planConsultationService.getConsultationFromToken(this.token)
        // .pipe(catchError(this.handleError))
        .subscribe(consultation => {
          this.consultation = consultation;
          this.loading = false;
          if(consultation.status !== 'pending') {
            this.error = this.translate.instant('planConsultation.alreadyStarted')
          }
        }, err=>{
          this.loading = false;
          this.success = false;
          this.error = this.translate.instant(`planConsultation.invalidUrl`)
        })
    );
    //
  }

  handleSubmit() {
    if (!this.consultation || !this.consultation.id) {
      return;
    }

    const consultationUrl = `/consultation/${this.consultation.id}`;
    const delay = this.planConsultationForm.get("delay").value;

    this.loading = true;

    this.subscriptions.push(
      this.planConsultationService.planConsultation(this.token, this.consultation.id, delay)
        .subscribe(res => {
          this.success = true;
          this.loading = false;

          this.subscriptions.push(
            this.authService.getCurrentUser().subscribe(
              user => {
                if (user) {
                  this.router.navigate([consultationUrl], {
                    state: {
                      confirmed: true,
                      shouldStartConsultation: true
                    }
                  });
                } else {
                  this.router.navigate(['/login'], {
                    queryParams: {
                      redirectUrl: consultationUrl
                    }
                  });
                }
              },
              error => {
                this.router.navigate(['/login'], {
                  queryParams: {
                    redirectUrl: consultationUrl
                  }
                });
              }
            )
          );
        }, err => {
          this.loading = false;
          this.success = false;
          this.error = this.translate.instant(`planConsultation.${err}`)
        })
    )
  }

  goToConsultation() {
    if (!this.consultation || !this.consultation.id) {
      return;
    }

    const consultationUrl = `/consultation/${this.consultation.id}`;

    this.subscriptions.push(
      this.authService.getCurrentUser().subscribe(
        user => {
          if (user) {
            this.router.navigate([consultationUrl], {
              state: {
                confirmed: true,
                shouldStartConsultation: true
              }
            });
          } else {
            this.router.navigate(['/login'], {
              queryParams: {
                redirectUrl: consultationUrl
              }
            });
          }
        },
        error => {
          this.router.navigate(['/login'], {
            queryParams: {
              redirectUrl: consultationUrl
            }
          });
        }
      )
    );
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
