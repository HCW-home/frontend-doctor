import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class TranslationOrganizationService {

  constructor(private http: HttpClient) {

  }
  getTranslationOrganizations(): Observable<any> {
    return this.http.get<any[]>(environment.api + `/translationOrganization?limit=2000`);
  }

  getLanguages(): Observable<any> {
    return this.http.get<any[]>(environment.api + `/languages`);
  }

}
