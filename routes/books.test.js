process.env.NODE_ENV = 'test';

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let book_isbn;


beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '123432122',
        'https://amazon.com/taco',
        'Elie',
        'English',
        100,
        'Nothing publishers',
        'my first book', 2008)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
})

afterEach(async () => {
    await db.query("DELETE FROM books")
})

afterAll(async () => {
    await db.end()
})

describe("GET /books", function () {
    test("returns list of one book", async () => {
        const response = await request(app).get('/books')
        const books = response.body.books;
        expect(books[0]).toHaveProperty("isbn")
        expect(books[0]).toHaveProperty("title")
        expect(books[0]).toHaveProperty("author")
        expect(books.length).toEqual(1)
    })
})

describe("GET /books/:isbn", function () {
    test("returns book data from specified isbn", async () => {
        const response = await request(app).get(`/books/${book_isbn}`)
        expect(response.body.book).toHaveProperty("title")
        expect(response.body.book.title).toBe("my first book")
    })
    test("returns 404 error if not found", async () => {
        const response = await request(app).get(`/books/0h12evq-2`)
        expect(response.statusCode).toBe(404)
    })
})

describe("POST /books", function () {
    test("creates book data from specified isbn", async () => {
        const response = await request(app)
            .post(`/books`)
            .send({
                isbn: "B0BPFXF18R",
                badField: "I AM A BOOK",
                amazon_url: "https://www.amazon.com/dp/B0BPFXF18R/ref=s9_acsd_al_bw_c2_x_1_i?pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-7&pf_rd_r=V6NH373A87JECJ381Z25&pf_rd_t=101&pf_rd_p=80b63ee2-5122-40a0-8486-0627e2da2310&pf_rd_i=83110516011",
                author: "Amber Vittoria",
                language: "English",
                pages: 141,
                publisher: "Andrews McMeel Publishing",
                title: "These Are My Big Girl Pants: Poetry and Paintings on Womanhood",
                year: 2023
            })
        expect(response.body.book.title).toBe("These Are My Big Girl Pants: Poetry and Paintings on Womanhood")
        expect(response.body.book.isbn).toBe("B0BPFXF18R")
    })
})

describe("PUT /books/:isbn", function () {
    test("updates book data from specified isbn", async () => {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                isbn: "B09XM4GDLV",
                badField: "DO NOT ADD ME!",
                amazon_url: "https://www.amazon.com/dp/B09XM4GDLV/ref=s9_acsd_al_bw_c2_x_0_i?pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-7&pf_rd_r=V6NH373A87JECJ381Z25&pf_rd_t=101&pf_rd_p=80b63ee2-5122-40a0-8486-0627e2da2310&pf_rd_i=83110516011",
                author: "Lauren Fleshman",
                language: "English",
                pages: 286,
                publisher: "Penguin Press",
                title: "Good for a Girl: A Woman Running in a Man's World",
                year: 2023
              })

        expect(response.body.book.title).toBe("Good for a Girl: A Woman Running in a Man's World")
        expect(response.body.book.isbn).toBe("123432122")
    })
    test("returns 404 error if not found", async () => {
        const response = await request(app).put(`/books/3y1fwv921`)
        expect(response.statusCode).toBe(404)
    })
})

describe("DELETE /books/:isbn", function () {
    test("deletes from specified isbn", async () => {
        const response = await request(app).delete(`/books/${book_isbn}`)
    })
    test("returns 404 error if not found", async () => {
        const response = await request(app).delete(`/books/128y35nafls`)
        expect(response.statusCode).toBe(404)
    })
})