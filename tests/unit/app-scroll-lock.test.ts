import assert from "node:assert/strict"
import test from "node:test"

import { acquireAppScrollLock } from "../../lib/app-scroll-lock.ts"

function createDocumentFixture(bodyOverflow = "auto", rootOverflow = "scroll") {
  const root = { style: { overflow: rootOverflow } }
  const documentFixture = {
    body: { style: { overflow: bodyOverflow } },
    querySelector(selector: string) {
      return selector === "[data-app-scroll-root]" ? root : null
    },
  } as unknown as Document

  return { documentFixture, root }
}

test("keeps body and app root locked until the final release", () => {
  const { documentFixture, root } = createDocumentFixture()
  const firstRelease = acquireAppScrollLock(documentFixture)
  const secondRelease = acquireAppScrollLock(documentFixture)

  assert.equal(documentFixture.body.style.overflow, "hidden")
  assert.equal(root.style.overflow, "hidden")

  firstRelease()
  assert.equal(documentFixture.body.style.overflow, "hidden")
  assert.equal(root.style.overflow, "hidden")

  secondRelease()
  assert.equal(documentFixture.body.style.overflow, "auto")
  assert.equal(root.style.overflow, "scroll")
})

test("makes every cleanup idempotent", () => {
  const { documentFixture, root } = createDocumentFixture("visible", "auto")
  const release = acquireAppScrollLock(documentFixture)

  release()
  release()

  assert.equal(documentFixture.body.style.overflow, "visible")
  assert.equal(root.style.overflow, "auto")

  const nextRelease = acquireAppScrollLock(documentFixture)
  assert.equal(documentFixture.body.style.overflow, "hidden")
  nextRelease()
  assert.equal(documentFixture.body.style.overflow, "visible")
})
