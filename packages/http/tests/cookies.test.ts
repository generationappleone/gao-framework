import { describe, expect, it } from 'vitest';
import { clearCookie, getCookies, setCookie } from '../src/cookies.js';
import { GaoRequest } from '../src/request.js';
import { GaoResponse } from '../src/response.js';

describe('Cookies utility', () => {
  it('should parse cookies from request correctly', () => {
    const req = new GaoRequest(
      new Request('http://localhost/', {
        headers: { Cookie: 'user=admin; sid=12345; encoded=foo%20bar' },
      }),
    );

    const cookies = getCookies(req);

    expect(cookies).toEqual({
      user: 'admin',
      sid: '12345',
      encoded: 'foo bar',
    });
  });

  it('should set cookies with secure defaults on response', () => {
    const res = new GaoResponse();

    setCookie(res, 'sid', 'xyz_890');

    const response = res.build();
    const setCookieHeaders = response.headers.get('set-cookie');

    expect(setCookieHeaders).toContain('sid=xyz_890');
    expect(setCookieHeaders).toContain('Path=/');
    expect(setCookieHeaders).toContain('Secure');
    expect(setCookieHeaders).toContain('HttpOnly');
    expect(setCookieHeaders).toContain('SameSite=Lax');
  });

  it('should merge custom cookie options', () => {
    const res = new GaoResponse();

    setCookie(res, 'theme', 'dark', { sameSite: 'Strict', secure: false, maxAge: 3600 });

    const response = res.build();
    const setCookieHeader = response.headers.get('set-cookie');

    expect(setCookieHeader).toContain('theme=dark');
    expect(setCookieHeader).toContain('Max-Age=3600');
    expect(setCookieHeader).toContain('SameSite=Strict');
    expect(setCookieHeader).not.toContain('Secure'); // explicitly disabled
  });

  it('should format clear cookie correctly', () => {
    const res = new GaoResponse();

    clearCookie(res, 'sid');

    const response = res.build();
    const setCookieHeader = response.headers.get('set-cookie');

    expect(setCookieHeader).toContain('sid=');
    expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });
});
