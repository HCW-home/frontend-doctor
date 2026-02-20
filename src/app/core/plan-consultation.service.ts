import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanConsultationService {

  constructor(private http: HttpClient) { }

  public planConsultation(consultation: any, delay: number) {
    return this.http.post(environment.api + `/plan-consultation`, { consultation, delay });
  }
}
