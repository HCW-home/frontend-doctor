import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  constructor(private http: HttpClient) {

  }
  getLanguages(): Observable<any> {
    return this.http.get<any[]>(environment.api + `/language?limit=2000`);

  }

}
