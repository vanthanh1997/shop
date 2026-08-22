import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiError } from '@core/api/api-error';
import { TranslateFn } from '@core/i18n/lang';
import { LanguageService } from '@core/i18n/language-service';
import { ToastService } from '@core/services/toast-service';
import { errorInterceptor } from './error-interceptor';

/**
 * Thay ToastService thật để test không phải chạy setTimeout của TTL.
 * Chữ ký `error(text: string): number` khớp đúng bản thật — stub sai chữ ký là
 * cách tự tay làm test xanh trong khi code hỏng.
 */
class ToastServiceStub {
  readonly messages: string[] = [];

  error(text: string): number {
    this.messages.push(text);
    return this.messages.length;
  }
}

/**
 * Thay LanguageService bằng một object chỉ có đúng thứ interceptor dùng: field `t`.
 * `t` trả lại chính khoá, nên mọi khẳng định bên dưới là khẳng định vào KHOÁ.
 * Không dựng máy dịch thật trong test của tầng HTTP: nó kéo theo HttpClient để
 * tải file dịch, mà HttpClient ở đây đã bị HttpTestingController chiếm.
 */
// Khai kiểu ở BIẾN, không `as`: trong một type assertion, `key` không được suy
// kiểu theo ngữ cảnh và sẽ vi phạm noImplicitAny.
const languageStub: { t: TranslateFn } = { t: (key) => key };

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let toast: ToastServiceStub;

  beforeEach(() => {
    toast = new ToastServiceStub();

    TestBed.configureTestingModule({
      providers: [
        // KHÔNG dùng withFetch() ở đây: backend thật sẽ bị thay ngay dòng dưới.
        provideHttpClient(withInterceptors([errorInterceptor])),
        // provideHttpClientTesting PHẢI đứng SAU provideHttpClient: nó ghi đè
        // HttpBackend, và trong Angular DI provider khai sau thắng.
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
        { provide: LanguageService, useValue: languageStub },
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Bắt lỗi "quên flush": nếu còn request treo, test fail ngay tại đây
    // thay vì làm hỏng test sau.
    backend.verify();
  });

  it('dịch 400 kèm envelope thành ApiError và KHÔNG bắn toast', () => {
    let caught: unknown = null;
    http.post('/api/auth/register', { email: 'a', password: 'b' }).subscribe({
      next: () => {
        throw new Error('Không được đi vào nhánh next');
      },
      error: (error: unknown) => (caught = error),
    });

    backend.expectOne('/api/auth/register').flush(
      {
        success: false,
        data: null,
        message: 'Dữ liệu không hợp lệ.',
        errors: { Email: ['Email không đúng định dạng.'] },
        traceId: 'trace-400',
      },
      // statusText BẮT BUỘC khi đặt status tuỳ ý, nếu không flush() ném lỗi.
      { status: 400, statusText: 'Bad Request' },
    );

    expect(caught).toBeInstanceOf(ApiError);

    const error = caught as ApiError;
    expect(error.status).toBe(400);
    expect(error.isValidation).toBe(true);
    // Câu THẬT của backend, không phải khoá: envelope.message có thì nó thắng.
    expect(error.message).toBe('Dữ liệu không hợp lệ.');
    expect(error.traceId).toBe('trace-400');
    expect(error.fieldError('email')).toBe('Email không đúng định dạng.');

    // Đây là khẳng định quan trọng nhất của test này: 400 KHÔNG toast,
    // vì lỗi sẽ được hiển thị ngay dưới ô nhập ở bước 4.
    expect(toast.messages).toEqual([]);
  });

  it('bắn toast và đọc Retry-After khi bị 429', () => {
    let caught: unknown = null;
    http.post('/api/auth/login', { email: 'a', password: 'b' }).subscribe({
      error: (error: unknown) => (caught = error),
    });

    backend.expectOne('/api/auth/login').flush(
      {
        success: false,
        data: null,
        message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
        errors: null,
        traceId: 'trace-429',
      },
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Retry-After': '42' },
      },
    );

    const error = caught as ApiError;
    expect(error.isTooManyRequests).toBe(true);
    expect(error.retryAfterSeconds).toBe(42);
    // Backend có gửi message nên toast hiện đúng câu đó, không phải khoá dự phòng.
    // Ca này chốt thứ tự ưu tiên: envelope.message > defaultMessage(status, t).
    expect(toast.messages).toEqual(['Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.']);
  });

  it('coi lỗi mạng là status 0, dùng KHOÁ dự phòng của client và bắn toast', () => {
    let caught: unknown = null;
    http.get('/api/auth/me').subscribe({
      error: (error: unknown) => (caught = error),
    });

    // error() với ProgressEvent là overload còn hiệu lực (bản nhận ErrorEvent
    // đã @deprecated). Không truyền status => mặc định 0.
    backend.expectOne('/api/auth/me').error(new ProgressEvent('error'));

    const error = caught as ApiError;
    expect(error.isNetwork).toBe(true);
    expect(error.status).toBe(0);
    // Khẳng định vào khoá. Với `t = (key) => key`, đây chính là bằng chứng
    // interceptor tra đúng MESSAGE_KEY_BY_STATUS[0] chứ không nhặt chuỗi
    // "Failed to fetch" của trình duyệt.
    expect(error.message).toBe('errors.network');
    expect(toast.messages).toEqual(['errors.network']);
  });

  it('rơi về errors.serverError khi 502 trả HTML của nginx thay vì envelope', () => {
    let caught: unknown = null;
    http.get('/api/products').subscribe({
      error: (error: unknown) => (caught = error),
    });

    backend.expectOne('/api/products').flush('<html><body><h1>502 Bad Gateway</h1></body></html>', {
      status: 502,
      statusText: 'Bad Gateway',
    });

    const error = caught as ApiError;
    expect(error.isServerError).toBe(true);
    // Body không phải object => readEnvelope trả message null => dùng khoá dự phòng.
    // Không có status 502 trong bảng, nên nhánh `status >= 500` phải bắt được.
    expect(error.message).toBe('errors.serverError');
    expect(toast.messages).toEqual(['errors.serverError']);
  });
});
