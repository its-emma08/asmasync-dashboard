import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionPlanWidget } from './action-plan-widget';

describe('ActionPlanWidget', () => {
  let component: ActionPlanWidget;
  let fixture: ComponentFixture<ActionPlanWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionPlanWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionPlanWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
