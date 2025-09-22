import { Injectable, Injector } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import { environment } from '../../environments/environment'

import { Router } from '@angular/router'

import { io, Socket } from 'socket.io-client';
import { ConsultationService } from './consultation.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SocketEventsService {
  socket: Socket | null = null
  public initialized = false
  private connection: Subject<String> = new Subject()
  public consultationClosedSubj: Subject<any> = new Subject()
  private user: any = null;

  constructor(private router: Router, private injector: Injector) { }

  private socketGet(url: string, data: any, callback: (resData: any, jwres?: any) => void) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, attempting callback with success');
      return callback({ success: true }, { statusCode: 200 });
    }

    const sailsMessage = {
      method: 'get',
      url: url,
      data: data || {},
      headers: {
        'x-access-token': this.user?.token || '',
        'authorization': `Bearer ${this.user?.token || ''}`,
        'id': this.user?.id?.toString() || ''
      }
    };

    this.socket.emit('get', sailsMessage, (response: any) => {
      console.log('Sails.js response:', response);
      if (response && response.statusCode >= 200 && response.statusCode < 300) {
        callback(response.body || response, response);
      } else {
        callback(response || { success: true }, { statusCode: 200 });
      }
    });
  }

  init(currentUser) {
    console.info('initialize socket ', this.initialized)
    if (this.initialized && this.user && this.user.token === currentUser.token) {
      return
    }

    this.user = currentUser;

    this.socket = io(environment.host, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      path: '/socket.io',
      query: {
        token: currentUser.token,
        __sails_io_sdk_version: '1.2.1',
        __sails_io_sdk_platform: 'browser',
        __sails_io_sdk_language: 'javascript'
      },
      extraHeaders: {
        id: currentUser.id.toString(),
        'x-access-token': currentUser.token,
      }
    });

    (window as any).socket = this.socket

    // window.socket
    this.socket.on(
      'connect',
      function socketConnected() {
        this.connection.next('connect')

        this.socketGet('/api/v1/subscribe-to-socket', {}, (resData, jwres) => {
          console.info('res data subscribe-to-socket', resData, jwres)
          this.initialized = true
        })
        this.socketGet('/api/v1/subscribe-to-doctors', {}, (resData, jwres) => {
          console.info('res data subscribe-to-doctors', resData, jwres)
        })
      }.bind(this),
    )
    this.socket.on('error', (err) => {
      this.connection.next('connect_failed')
      console.info('Error connecting to server', err)
    })

    this.socket.on('disconnect', () => {
      console.info('Disconnect from server')
    })

    this.socket.on('reconnect', (number) => {
      this.connection.next('connect')
      console.info('Reconnected to server', number)
      try {
        const  consultationsService =  this.injector.get(ConsultationService);
        const pendingCount = consultationsService.consultationsOverview.filter(
          (c) => c.consultation.status === "pending"
        ).length

        consultationsService.loadConsultationOverview().subscribe(consultations=>{
          const pendingCountAfterUpdate = consultations.filter(
            (c) => c.consultation.status === "pending"
          ).length
          if(pendingCountAfterUpdate> pendingCount){
            this.playAudio()
          }
        })

      } catch (error) {
        console.error(error)
      }
    })

    this.socket.on('reconnect_attempt', () => {
      this.connection.next('connect_failed')
      console.info('Reconnect Attempt')
    })

    this.socket.on('reconnecting', (number) => {
      console.info('Reconnecting to server', number)
      this.injector.get(AuthService).verifyRefreshToken().subscribe({
        next: (res) => {}, error: (err) => {
          if (err.status === 401) {
            this.injector.get(AuthService).logout();
          }
        }
      })
      if (number > 9) {
        this.injector.get(AuthService).logout();
      }
    })

    this.socket.on('reconnect_error', (err) => {
      this.connection.next('connect_failed')
      console.info('Reconnect Error', err)
    })

    this.socket.on('reconnect_failed', () => {
      this.connection.next('connect_failed')
      console.info('Reconnect failed')
    })

    this.socket.on('connect_error', () => {
      this.connection.next('connect_failed')
      console.info('connect_error')
    })
  }

  updateConnectionStatus(status) {
    this.connection.next(status)
  }

  connectionSub(): Subject<any> {
    return this.connection
  }

  onConsultation(): Subject<any> {
    const sub = new Subject()
    const obs = Observable.create((observer) => {
      this.socket.on('newConsultation', (e) => {
        console.info('new consultation', e)
        this.playAudio()
        observer.next(e)
      })
    })
    obs.subscribe(sub)
    return sub
  }

  onConsultationClosed(): Subject<any> {

    const sub = new Subject()
    const obs = Observable.create((observer) => {
      this.socket.on('consultationClosed', (e) => {
        console.info('consultation closed ........', e)
        observer.next(e)
      })
    })
    obs.subscribe(sub)
    return sub
  }

  onMessage(): Subject<any> {
    const sub = new Subject()
    const obs = Observable.create((observer) => {
      this.socket.on('newMessage', (e) => {
        console.info('new mesg ', e)
        observer.next(e)
      })
    })
    obs.subscribe(sub)
    return sub
  }

  onOnlineStatusChange(): Subject<any> {
    const sub = new Subject()
    const obs = Observable.create((observer) => {
      this.socket.on('onlineStatusChange', (e) => {
        console.info('online status change')
        console.info('e :: ', e)
        observer.next(e)
      })

    })
    obs.subscribe(sub)
    return sub
  }

  onCall(): Subject<any> {
    const sub = new Subject()
    const obs = Observable.create((observer) => {
      this.socket.on('newCall', (e) => {
        console.info('End call ', e)
        observer.next(e)
      })
    })
    obs.subscribe(sub)
    return sub
  }

  onRejectCall(): Subject<any> {
    const sub = new Subject()
    const obs = Observable.create((observer) => {

      this.socket.on('rejectCall', (e) => observer.next(e))
    })
    obs.subscribe(sub)
    return sub
  }

  onAcceptCall() {
    const obs = Observable.create((observer) => {
      this.socket.on('acceptCall', (e) => {
        console.info('Accepted Call EVENT >>>>>>>>>>>>>>>>>>>>>>>>>>>>> ', e)
        observer.next(e)
      })
    })

    return obs
  }

  onConsultationAccepted() {
    const obs = Observable.create((observer) => {
      this.socket.on('consultationAccepted', (e) => {
        console.info('consultation accepted')
        observer.next(e)
      })
    })

    return obs
  }

  onConsultationCanceled() {
    const obs = Observable.create((observer) => {
      this.socket.on('consultationCanceled', (e) => {
        console.info('consultation canceled')
        observer.next(e)
      })
    })

    return obs
  }

  onEndCall(): Subject<any> {
    const sub = new Subject()
    const obs = Observable.create((observer) => {
      console.info('end call event')
      this.socket.on('endCall', (e) => {
        console.info('new call ', e)
        observer.next(e)
      })
    })
    obs.subscribe(sub)
    return sub
  }

  onConsultationUpdated(): Subject<any> {
    const sub = new Subject()
    const obs = Observable.create((observer) => {
      this.socket.on('consultationUpdated', (e) => {
        console.info('a consultation have been updated', e)

        observer.next(e)
      })
    })
    obs.subscribe(sub)
    return sub
  }

  playAudio() {
    const audio = new Audio()
    audio.src = '../assets/sounds/notification.mp3'
    audio.load()
    audio.play()
  }

  disconnect() {
    if (!this.socket || !this.socket.connected) {
      return
    }
    return this.socket.disconnect()
  }
}
