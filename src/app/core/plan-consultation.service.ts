import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanConsultationService {

  constructor(private http: HttpClient) { }

  public getConsultationFromToken(token: string) {
    return this.http.get<any>(environment.api + `/consultations-from-token?token=${token}`);
  }
  public planConsultation(token, consultation: any, delay: number) {
    return this.http.post(environment.api + `/plan-consultation`, {token, consultation, delay});
  }


}
