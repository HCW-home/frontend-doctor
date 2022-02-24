import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError as observableThrowError } from 'rxjs';
import { environment } from '../environments/environment'
interface Device {

  /**
   * `"videoinput"`, `"audioinput"`
   */
  kind: string;

  /**
   * Unique ID for the device. Use it on `audioSource` or `videoSource` properties of [[PublisherProperties]]
   */
  deviceId: string;

  /**
   * Description of the device. An empty string if the user hasn't granted permissions to the site to access the device
   */
  label: string;
}
@Injectable({
  providedIn: 'root'
})

export class OpenViduService {


  constructor(private http: HttpClient) {

  }

  getToken(mySessionId: string, audioOnly): Promise<any> {
    return this.createSessionAndGetToken(mySessionId, audioOnly);
  }

  createSessionAndGetToken(sessionId: string, audioOnly): Promise<any> {
    return new Promise((resolve, reject) => {

      const body = JSON.stringify({ customSessionId: sessionId });
      const options = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',

        })
      };
      const subscription = this.http.post<any>(environment.api + '/consultation/' + sessionId + '/call?audioOnly=' + audioOnly, body, options)
        .pipe(
          catchError(error => {
            error.status === 409 ? resolve(sessionId) : reject(error);
            subscription.unsubscribe()
            return observableThrowError(error);
          })
        )
        .subscribe(response => {
          console.log('response >> ', response);
          resolve(response);
        });
    });
  }

  rejectCall(consultation: string, message): Promise<any> {
    return new Promise((resolve, reject) => {

      const body = JSON.stringify({});
      const options = {

        headers: new HttpHeaders({
          'Content-Type': 'application/json',

        })
      };
      const subscription = this.http.post<any>(environment.api + '/consultation/' + consultation + '/' + message + '/reject-call', {}, options)
        .subscribe(response => {
          console.log('response >> ', response);
          resolve(null);
          subscription.unsubscribe()
        });
    });
  }

  acceptCall(consultation: string, message): Promise<any> {
    return new Promise((resolve, reject) => {

      const body = JSON.stringify({});
      const options = {

        headers: new HttpHeaders({
          'Content-Type': 'application/json',

        })
      };
      const subscription = this.http.post<any>(environment.api + '/consultation/' + consultation + '/' + message + '/accept-call', {}, options)
        .subscribe(response => {
          console.log('response >> ', response);
          resolve(null);
          subscription.unsubscribe()
        });
    });
  }

  getTestToken(): Promise<any> {
    return new Promise((resolve, reject) => {


      return this.http.get<any>(environment.api + '/consultation/test-call')
        .pipe(
          catchError(error => {
            error.status === 409 ? resolve(null) : reject(error);
            return observableThrowError(error);
          })
        )
        .subscribe(response => {
          console.log('response >> ', response);
          resolve(response);
        });
    });
  }

    /**
   * Collects information about the media input devices available on the system. You can pass property `deviceId` of a [[Device]] object as value of `audioSource` or `videoSource` properties in [[initPublisher]] method
   */
  getDevices(): Promise<Device[]> {
    return new Promise<Device[]>((resolve, reject) => {
      navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
        const devices: Device[] = [];




          // Rest of platforms
          deviceInfos.forEach(deviceInfo => {
            if (deviceInfo.kind === 'audioinput' || deviceInfo.kind === 'videoinput') {
              devices.push({
                kind: deviceInfo.kind,
                deviceId: deviceInfo.deviceId,
                label: deviceInfo.label
              });
            }
          });
          resolve(devices);
        })


    });
  }
}
