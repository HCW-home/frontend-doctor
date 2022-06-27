import { Injectable } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import { environment } from '../environments/environment'

import { Router } from '@angular/router'

import io from 'socket.io-client';
import sailsIOClient from 'sails.io.js'
import { ConsultationService } from './consultation.service';
const sailsIo = sailsIOClient(io);
sailsIo.sails.autoConnect = false;

@Injectable({
  providedIn: 'root',
})
export class SocketEventsService {
  socket
  initialized = false
  private connection: Subject<String> = new Subject()
  public consultationClosedSubj: Subject<any> = new Subject()

  constructor(private router: Router, private consultationsService: ConsultationService) { }

  init(currentUser) {
    // console.info('sails ' , io.sails)
    console.info('initialize socket ', this.initialized)
    if (this.initialized) {
      return
    }
    sailsIo.sails.query = `token=${currentUser.token}`
    sailsIo.sails.headers = {
      id: currentUser.id,
      'x-access-token': currentUser.token,
    }
    this.socket = sailsIo.sails.connect(environment.host, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
      ; (window as any).socket = this.socket

    // window.socket
    this.socket.on(
      'connect',
      function socketConnected() {
        console.log('socket connected ...........')
        this.connection.next('connect')
        this.connectionStatus = 'connect'

        this.socket.get('/api/v1/subscribe-to-socket', {}, function (
          resData,
          jwres,
        ) {
          // ...
          console.info('res data ', resData, jwres)
        })
        this.socket.get('/api/v1/subscribe-to-doctors', {}, function (
          resData,
          jwres,
        ) {
          // ...
          console.info('res data ', resData, jwres)
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
      this.consultationsService.loadConsultationOverview()
    })

    this.socket.on('reconnect_attempt', () => {
      this.connection.next('connect_failed')
      console.info('Reconnect Attempt')
    })

    this.socket.on('reconnecting', (number) => {
      console.info('Reconnecting to server', number)
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

    this.initialized = true
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
    if (!this.socket || !this.socket.isConnected()) {
      return
    }
    return this.socket.disconnect()
  }
}
