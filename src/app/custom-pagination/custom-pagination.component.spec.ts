import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPaginationComponent } from './custom-pagination.component';

describe('CustomPaginationComponent', () => {
  let component: CustomPaginationComponent;
  let fixture: ComponentFixture<CustomPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomPaginationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
