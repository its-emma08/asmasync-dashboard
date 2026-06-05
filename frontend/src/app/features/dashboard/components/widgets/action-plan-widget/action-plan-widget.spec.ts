import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionPlanWidgetComponent } from './action-plan-widget';

describe('ActionPlanWidgetComponent', () => {
  let component: ActionPlanWidgetComponent;
  let fixture: ComponentFixture<ActionPlanWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionPlanWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionPlanWidgetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
