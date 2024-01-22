import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";

@Component({
    selector: "app-filter-modal",
    templateUrl: "./filter-modal.component.html",
    styleUrls: ["./filter-modal.component.scss"]
})
export class FilterModalComponent implements OnInit {
    queues = [];
    appLiedFiltersCount: number = 0;
    createdByMe = false;
    createdByNotMe = false;


    constructor(@Inject(MAT_DIALOG_DATA) public data: { queues: any[], filterState: any, appLiedFiltersCount: number }) {
    }

    ngOnInit(): void {
        this.queues = this.data.queues;
        this.appLiedFiltersCount = this.data.appLiedFiltersCount;
        this.initForm();

        console.log(this.data, "data")
    }

    private initForm() {
        const savedState = this.data.filterState;
        // Initialize form with saved state if available
        if (savedState) {
            this.queues = this.data.filterState.queues;
            this.createdByMe = this.data.filterState.createdBy.me;
            this.createdByNotMe = this.data.filterState.createdBy.notMe;
        } else {
            this.queues = this.data.queues.map(queue => ({...queue, selected: false}));
        }
    }

    getSelectedFilters() {
        return {
            queues: this.queues,
            createdBy: {
                me: this.createdByMe,
                notMe: this.createdByNotMe
            }
        };
    }

}
