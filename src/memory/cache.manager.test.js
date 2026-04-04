import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from './cache.manager.js';

describe('CacheManager', () => {
    let cache;

    beforeEach(() => {
        cache = new CacheManager();
    });

    describe('get / set', () => {
        it('캐시 미스는 null을 반환한다', () => {
            expect(cache.get('missing')).toBeNull();
        });

        it('set 후 get은 동일한 값을 반환한다', () => {
            cache.set('key1', { data: 'hello' });
            expect(cache.get('key1')).toEqual({ data: 'hello' });
        });

        it('문자열, 숫자, 배열 등 다양한 타입을 저장할 수 있다', () => {
            cache.set('str', 'text');
            cache.set('num', 42);
            cache.set('arr', [1, 2, 3]);
            expect(cache.get('str')).toBe('text');
            expect(cache.get('num')).toBe(42);
            expect(cache.get('arr')).toEqual([1, 2, 3]);
        });

        it('같은 키에 덮어쓰면 최신 값을 반환한다', () => {
            cache.set('key', 'v1');
            cache.set('key', 'v2');
            expect(cache.get('key')).toBe('v2');
        });
    });

    describe('invalidate', () => {
        it('invalidate 후 해당 키는 null을 반환한다', () => {
            cache.set('key', 'value');
            cache.invalidate('key');
            expect(cache.get('key')).toBeNull();
        });

        it('존재하지 않는 키를 invalidate해도 에러가 나지 않는다', () => {
            expect(() => cache.invalidate('nonexistent')).not.toThrow();
        });
    });

    describe('invalidateAll', () => {
        it('모든 캐시 항목을 제거한다', () => {
            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);
            cache.invalidateAll();
            expect(cache.get('a')).toBeNull();
            expect(cache.get('b')).toBeNull();
            expect(cache.get('c')).toBeNull();
        });
    });

    describe('SessionStorage 미지원 환경', () => {
        it('sessionStorage가 없어도 메모리 캐시는 정상 동작한다', () => {
            // Node 환경에서는 sessionStorage가 없으므로 이 테스트가 해당 케이스를 커버
            cache.set('key', 'value');
            expect(cache.get('key')).toBe('value');
            cache.invalidate('key');
            expect(cache.get('key')).toBeNull();
        });
    });
});
