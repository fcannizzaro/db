import { describe, expect, it } from 'vitest'
import { compileSQL } from '../src/sql-compiler'
import { func, ref, val } from './sql-compiler.test'

describe(`sql-minimization`, () => {
  describe(`dedupeParams`, () => {
    it(`should remove duplicate params`, () => {
      const result = compileSQL({
        where: func(`or`, [
          // live query 1
          func(`eq`, [ref(`a`), val("5")]),
          // live query 2
          func(`gt`, [ref(`b`), val("5")]),
          // live query 3
          func(`eq`, [ref(`c`), val("true")]),
          // live query 4
          func(`not`, [func(`lt`, [ref(`d`), val("5")])]),
          // live query 5
          func(`eq`, [ref(`e`), val("text")]),
        ]),
      })
      const paramsKeys = Object.keys(result.params ?? {})
      expect(paramsKeys).toHaveLength(3)
      expect(paramsKeys).toMatchObject(["1", "2", "3"])
      expect(result.where).toBe(`("a" = $1) OR ("b" > $1) OR ("c" = $2) OR (NOT ("d" < $1)) OR ("e" = $3)`)
    })
  })

  describe(`dedupeWhere`, () => {
    it(`should remove duplicate where clauses`, () => {
      const result = compileSQL({
        where: func(`or`, [
          // live query 1
          func(`eq`, [ref(`a`), val("true")]),
          // live query 2
          func(`eq`, [ref(`b`), val("true")]),
          // live query 3
          func(`eq`, [ref(`a`), val("true")]),
          // live query 4
          func(`eq`, [ref(`a`), val("false")]),
        ]),
      })
      const paramsKeys = Object.keys(result.params ?? {})
      expect(paramsKeys).toHaveLength(2)
      expect(paramsKeys).toMatchObject(["1", "2"])
      expect(result.where).toBe(`("a" = $1) OR ("b" = $1) OR ("a" = $2)`)
    })
  })
})
