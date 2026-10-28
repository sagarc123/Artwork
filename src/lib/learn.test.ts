import { test } from 'node:test'
import assert from 'node:assert/strict'
import { neighbours, newCertId, nameOnCertificate, nextToDo, progressCount, publicName, readCertId, resumeLesson, shouldIssue, showCertId } from './learn.ts'

const lessons = [
  { id: 30, order: 3 },
  { id: 10, order: 1 },
  { id: 20, order: 2 },
]

test('progress counts only lessons that exist, each once', () => {
  assert.deepEqual(progressCount([10, 20, 30], [10]), { done: 1, total: 3, percent: 33, complete: false })
  assert.equal(progressCount([10, 20, 30], [10, 10, 20, 30]).complete, true)
  assert.equal(progressCount([10, 20], [10, 99]).done, 1) // a deleted lesson is not counted
  assert.equal(progressCount([10, 20], [10, 20, 99]).complete, true)
  assert.equal(progressCount([], []).complete, false) // an empty course never completes
})

test('resume: the last lesson if it still exists, else the first', () => {
  assert.equal(resumeLesson(lessons, 20)?.id, 20)
  assert.equal(resumeLesson(lessons, null)?.id, 10)
  assert.equal(resumeLesson(lessons, 999)?.id, 10) // the last lesson was deleted
  assert.equal(resumeLesson([], 1), null)
})

test('previous, next and what to do after "done"', () => {
  assert.deepEqual(neighbours(lessons, 20), { prev: lessons[1], next: lessons[0] })
  assert.equal(neighbours(lessons, 10).prev, null)
  assert.equal(neighbours(lessons, 30).next, null)
  assert.equal(nextToDo(lessons, 10, [10])?.id, 20)
  assert.equal(nextToDo(lessons, 10, [10, 20])?.id, 30) // 20 is already done
  assert.equal(nextToDo(lessons, 30, [30, 10])?.id, 20) // wraps to an earlier lesson not yet done
  assert.equal(nextToDo(lessons, 30, [10, 20, 30]), null)
})

test('a certificate is issued once, only when everything is done', () => {
  assert.equal(shouldIssue(progressCount([1, 2], [1]), null), false)
  assert.equal(shouldIssue(progressCount([1, 2], [1, 2]), null), true)
  assert.equal(shouldIssue(progressCount([1, 2], [1, 2]), { id: 5 }), false) // marking done again never issues a second one
})

test('certificate ids: 10 characters, no look-alikes, readable back', () => {
  const ids = new Set(Array.from({ length: 500 }, () => newCertId()))
  assert.equal(ids.size, 500)
  for (const id of ids) assert.match(id, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/)
  assert.equal(newCertId(() => 0), 'AAAAAAAAAA')
  assert.equal(showCertId('ABCDEFGHJK'), 'ART-ABCDE-FGHJK')
  assert.equal(readCertId('art-abcde-fghjk'), 'ABCDEFGHJK')
  assert.equal(readCertId(' ABCDEFGHJK '), 'ABCDEFGHJK')
  for (const bad of ['', undefined, 'ART-12', 'ABCDEFGHJ0', 'ABCDEFGHJKL', "ABCDE'; DROP"]) assert.equal(readCertId(bad), null)
})

test('the name on a certificate: a child gets only the first name, never the parent\'s', () => {
  assert.equal(nameOnCertificate({ under18: true, customerName: 'Parent Kulkarni', childFirstName: ' Anaya Joshi ' }), 'Anaya')
  assert.equal(nameOnCertificate({ under18: true, customerName: 'Parent Kulkarni' }), '')
  assert.equal(nameOnCertificate({ under18: false, customerName: ' Priya  Sharma ' }), 'Priya Sharma')
  assert.equal(publicName('Anaya Joshi', true), 'Anaya')
  assert.equal(publicName('Priya Sharma', false), 'Priya Sharma')
})
