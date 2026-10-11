import {expect,test} from 'vitest';
import config from '../vite.config';
test('production base is repository scoped',()=>expect(config.base).toBe('/docanswerly-ai/'));
