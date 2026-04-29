import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AiChatMessage, User } from '../../types';

@Component({
  selector: 'app-student-ai-chat',
  standalone: false,
  templateUrl: './student-ai-chat.component.html',
  styleUrls: ['./student-ai-chat.component.scss'],
})
export class StudentAiChatComponent implements OnInit {
  currentUser: User | null = null;
  aiUserId = '';
  draftMessage = '';
  messages: AiChatMessage[] = [];
  errorMessage = '';
  infoMessage = 'Conectando voce ao assistente...';
  isInitializing = false;
  isSending = false;

  @ViewChild('messagesViewport')
  private messagesViewport?: ElementRef<HTMLDivElement>;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();

    if (!this.currentUser?.email) {
      this.errorMessage = 'Nao foi possivel identificar seu login para iniciar o chat.';
      this.infoMessage = '';
      return;
    }

    this.bootstrapConversation();
  }

  bootstrapConversation(): void {
    if (!this.currentUser?.email || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    this.errorMessage = '';
    this.infoMessage = 'Preparando sua conversa com a IA...';

    this.api.lookupAiUserByEmail(this.currentUser.email)
      .pipe(
        timeout(12000),
        finalize(() => {
          this.ngZone.run(() => {
            this.isInitializing = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (userResponse) => {
          this.ngZone.run(() => {
            this.aiUserId = userResponse.userId;
            this.infoMessage = 'Iniciando o assistente...';
            this.cdr.detectChanges();
          });
          this.initChat();
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.errorMessage = error?.error?.error || 'Nao foi possivel localizar seu usuario na API de IA.';
            this.infoMessage = '';
            this.cdr.detectChanges();
          });
        },
      });
  }

  initChat(): void {
    if (!this.aiUserId) {
      this.errorMessage = 'Nao foi possivel iniciar a conversa com a IA.';
      this.infoMessage = '';
      return;
    }

    this.api.initAiChat(this.aiUserId)
      .pipe(timeout(12000))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.messages = [this.createMessage('ai', response.aiText)];
            this.infoMessage = 'Assistente pronto para conversar.';
            this.scrollToBottom();
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.errorMessage = error?.error?.error || 'Nao foi possivel abrir a conversa inicial.';
            this.infoMessage = '';
            this.cdr.detectChanges();
          });
        },
      });
  }

  sendMessage(): void {
    const text = (this.draftMessage || '').trim();
    if (!text || !this.aiUserId || this.isSending) {
      return;
    }

    this.isSending = true;
    this.errorMessage = '';
    const userMessage = this.createMessage('user', text);
    this.messages = [...this.messages, userMessage];
    this.draftMessage = '';
    this.infoMessage = 'A IA esta pensando na resposta...';
    this.scrollToBottom();

    this.api.sendAiChatMessage(this.aiUserId, text)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.ngZone.run(() => {
            this.isSending = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.messages = [...this.messages, this.createMessage('ai', response.aiText)];
            this.infoMessage = 'Assistente pronto para continuar.';
            this.scrollToBottom();
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.errorMessage = error?.error?.error || 'Nao foi possivel enviar sua mensagem para a IA.';
            this.infoMessage = 'Voce pode tentar novamente.';
            this.cdr.detectChanges();
          });
        },
      });
  }

  handleEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) {
      return;
    }

    keyboardEvent.preventDefault();
    this.sendMessage();
  }

  retryInitialization(): void {
    this.messages = [];
    this.aiUserId = '';
    this.bootstrapConversation();
  }

  trackByMessageId(_: number, message: AiChatMessage): string {
    return message.id;
  }

  private createMessage(author: 'user' | 'ai', text: string): AiChatMessage {
    return {
      id: `${author}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    };
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = this.messagesViewport?.nativeElement;
      if (!container) {
        return;
      }

      container.scrollTop = container.scrollHeight;
    }, 0);
  }
}