import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'translatedGender',
})
export class TranslatedGenderPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    switch (value) {
      case 'other':
        return 'Autre'
      case 'male':
        return 'Masculin'
      case 'female':
        return 'Féminin'
      case 'unknown':
        return 'Inconnu'
      default:
        return ''
    }
  }
}
