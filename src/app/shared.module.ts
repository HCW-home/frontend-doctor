import {NgModule} from "@angular/core";


import {MatBadgeModule} from "@angular/material/badge";
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatIconModule} from "@angular/material/icon";
import {MatListModule} from "@angular/material/list";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatToolbarModule} from "@angular/material/toolbar";

import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatSelectModule} from "@angular/material/select";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatNativeDateModule} from "@angular/material/core";
import {MatDatepickerModule} from "@angular/material/datepicker";

@NgModule({

    imports: [
        MatSidenavModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatBadgeModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatGridListModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatNativeDateModule,
        MatDatepickerModule
    ],
    exports: [
        MatSidenavModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatBadgeModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatGridListModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatNativeDateModule,
        MatDatepickerModule

    ],
})
export class SharedModule {
}
