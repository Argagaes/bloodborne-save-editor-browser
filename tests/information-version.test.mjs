import test from 'node:test';import assert from 'node:assert/strict';
import {shouldShowInformation,informationCookie} from '../src/information-version.js';
test('information is shown once per site version using a scoped cookie',()=>{
 assert.equal(shouldShowInformation('', 'v1'),true);
 assert.equal(shouldShowInformation('other=x; bb_editor_info_version=v1', 'v1'),false);
 assert.equal(shouldShowInformation('bb_editor_info_version=v1','v2'),true);
 assert.equal(shouldShowInformation('bb_editor_info_version=v10','v1'),true);
 assert.equal(informationCookie('v2','/editor/'),'bb_editor_info_version=v2; Max-Age=31536000; Path=/editor/; SameSite=Lax');
});
