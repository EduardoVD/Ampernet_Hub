import { TestBed } from '@angular/core/testing';
import { Notices } from './notices';

describe('Notices', () => {
  let service: Notices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Notices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
