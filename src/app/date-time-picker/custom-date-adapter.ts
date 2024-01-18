import { NativeDateAdapter} from "@angular/material/core";
import { format } from 'date-fns';

export class CustomDateAdapter extends NativeDateAdapter {
    format(date: Date, displayFormat: Object): string {
        return format(date, 'EEEE, MMMM do');
    }
}
