import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from '@shared/ui/toast-container/toast-container';
import { TopProgressBar } from '@shared/ui/top-progress-bar/top-progress-bar';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, TopProgressBar, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
