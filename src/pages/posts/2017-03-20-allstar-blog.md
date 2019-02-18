---
layout: post
title:  "SICP: Huffman Codes Example with Smashmouth"
date:   2017-03-20 21:00:00
categories: sicp
---


I was working through section 2.3.4 of The Structure and Interpretation of Computer Programs (SICP), which uses lists as data structures to build a huffman encoder and decoder. The last exercises of that section uses the encoder, decoder, and tree builder built in that section to encode lyrics from a 1950s song that I wasn't really familiar with. The point of the exercise was to see how encoding the lyrics resulted in a much smaller output than just encoding the text with something like ASCII. I thought it might be more fun to try it on a more recent song. This post is just going to go over the Huffman Code program and then use it for a more fun example.

## Huffman Codes

Huffman coding is a way of encoding symbols as bitstrings. Each encoded symbol is a variable-length code, whose length is based on how frequent that symbol shows up in an alphabet. Symbols that are used more often take up less bytes than characters used less often, which means you can compress text that has a lot of repeated symbols pretty well. Symbols can be encoded and decoded by traversing a binary tree that contains leaf nodes with symbols of the alphabet.

### Data Definitions

#### Leaf

For this exercise, leaf nodes are represented by lists where the first element is the symbol `'leaf`, the second element is the symbol associated with that leaf, and the third elemtn is the weight. Weight is determined by the frequency distribution.

`leaf?` is a procedure that takes an object and returns a boolean for whether or not the first element of the list is `'leaf`. It seems like kind of a hack, but it works.

`leaf-symbol` and `leaf-weight` take a `leaf` and return the `symbol` and `weight` fields of the object. This is all just an abstraction over lists, but I think that's the point of the exercise.

~~~
;; Leaf defintions
(define (make-leaf symbol weight)
  (list 'leaf symbol weight))

(define (leaf? object)
  (eq? (car object) 'leaf))

;; Leaf selectors
(define (leaf-symbol x) (cadr x))
(define (leaf-weight x) (caddr x))
~~~

#### Tree

A tree is created from a left and right argument, which can be either a `leaf` or another `tree`. The result is an object with the `left` argument, the `right` argument, the union of all symbols in both `left` and `right` and the sum of the weight of both `left` and `right`.

`left-branch` and `right-branch` are procedures that return the left and right child nodes of the `tree` given as an argument.

~~~
(define (make-code-tree left right)
  (list left
        right
        (append (symbols left) (symbols right))
        (+ (weight left) (weight right))))

(define (left-branch tree) (car tree))
(define (right-branch tree) (cadr tree))
~~~

The code above contains the not yet defined procedures `symbols` and `weight`, which should understandably return a list of `symbol`s and a `weight` value from the argument given. It's worth noting that the example passes `left` and `right` to those procedures, which means that they will need to handle both `leaf` and `tree` arguments.


#### Generic Operators

`symbol` and `weight` are generic operators because they are able to handle multiple types of input. If a `leaf` is given a list with that leaf's symbol should be returned, but if a `tree` is given, the `symbols` property of the `tree` object should be returned. The same general idea applies to the `weight` procedure.

~~~
;; Generic method for getting the list of symbols
;; at a given tree or leaf.
(define (symbols tree)
  (if (leaf? tree)
      (list (leaf-symbol tree))
      (caddr tree)))

;; Generic method for getting a weight for a tree
;; node or leaf.
(define (weight tree)
  (if (leaf? tree)
      (leaf-weight tree)
      (cadddr tree)))
~~~

Both procedures make use of the `leaf?` procedure to decide how to procede. The else clauses' of each procedure could be a little more abstract if we defined a `tree-symbols` and `tree-weight` procedure, but `leaf-symbol` and `weight-symbol` are only abstractions over `cadr` and `caddr` anyways. We actually could have just done

~~~
(define leaf-symbol cadr)
~~~

because `leaf-symbol` is essentially a renamed `cadr`.

### Building a Huffman Tree

For this example, a Huffman Tree is represented as an ordered set ordered by leaf weight. Building a tree involves adding to a set. The two necessary procedures are `adjoin-set` and `make-leaf-set`. `adjoin-set` takes a list with two elements (ex. `'(A 4)`) and an existing ordered set and adds the new element to the correct place in the set. `make-leaf-set` takes a list of new set elements and returns an ordered set of leaves.


~~~
;; Adds an item to an ordered set
(define (adjoin-set x set)
  (cond [(empty? set) (list x)]
        [(< (weight x) (weight (car set))) (cons x set)]
        [else (cons (car set)
                    (adjoin-set x (cdr set)))]))

(define (element-of-set? x set)
  (cond [(empty? set) false]
        [(eq? x (car set)) true]
        [else (element-of-set? x (cdr set))]))

;; Given a list of lists, return an ordered set of leaf
;; objects.
(define (make-leaf-set pairs)
  (if (empty? pairs)
      empty
      (let ([pair (car pairs)])
        (adjoin-set (make-leaf (car pair)
                               (cadr pair))
                    (make-leaf-set (cdr pairs))))))
~~~

I threw in `element-of-set?` because it's helpful for encoding.

In order to build a Huffman Tree, you find the smallest two items in the set, merge them into a tree, and repeat until you only have one set left. `successive-merge` takes an ordered set built by `make-leaf-set` and merges it together using `adjoin-set` and `make-code-tree` from earlier.

~~~
(define (generate-huffman-tree pairs)
  (successive-merge (make-leaf-set pairs)))

;; Find the two smallest weight things and replace them with a merged version
;; of the two leafs
(define (successive-merge leaf-set)
  (if (empty? (cdr leaf-set))
      (car leaf-set)
      (successive-merge
       (adjoin-set (make-code-tree (car leaf-set)
                                   (cadr leaf-set))
                   (cddr leaf-set)))))
~~~

### Decoding

To decode a bitstring back to a symbol string, start at the root of the tree. If the first bit in your bitstring is a `0` follow the left child of the root. If it's a `1`, follow the right child. Keep traversing the tree until you reach a leaf. Once you do that, add that leaf's symbol to your decoded output and repeat the procedure with the remaining bitstring left. Continue until your bitstring is empty.

~~~
;; Given a bitstring and a huffman tree
;; traverse the tree to decode the characters
;; from the bitstring and return the decoded result.
(define (decode bits tree)
  (define (decode-1 bits current-branch)
    (if (empty? bits)
        empty
        (let ([next-branch
               (choose-branch (car bits) current-branch)])
          (if (leaf? next-branch)
              (cons (leaf-symbol next-branch)
                    (decode-1 (cdr bits) tree))
              (decode-1 (cdr bits) next-branch)))))
  (decode-1 bits tree))

(define (choose-branch bit tree)
  (cond [(= bit 0) (left-branch tree)]
        [(= bit 1) (right-branch tree)]
        [else (error "Bit must be one or zero: choose-branch" bit)]))
~~~

### Encoding

To encode a string, start at the root of a huffman tree and follow it until you find the leaf with the first symbol of the string. Everytime you follow a left child, add `0` to your output, and everytime you take a right child, add a `1`.

This work is done by `encode` and `encode-symbol`.

`encode-symbol` takes a symbol and a tree, checks the left and right branch to see which branch has the symbol and follows until it hits a leaf, adding `0`s and `1`s to the return value until it hits a leaf with the given symbol.

`encode` takes a message and a tree and recursively calls `encode-symbol` on each symbol in the message until there are no symbols in the message.

~~~
(define (encode message tree)
    (if (empty? message)
        empty
        (append (encode-symbol (car message) tree)
                (encode (cdr message) tree))))

;; Given a letter, return a bitstring from the huffman encoding tree
;; Should error if the symbol doesn't exist in the tree
;;
;; If the symbol is in the symbols of the left branch (cons 0 (encode-symbol letter (left-branch tree))
(define (encode-symbol letter tree)
  (if (leaf? tree)
      empty
      (let ([left (left-branch tree)]
        [right (right-branch tree)])
        (cond [(element-of-set? letter (symbols left))
               (cons 0 (encode-symbol letter left))]
              [(element-of-set? letter (symbols right))
               (cons 1 (encode-symbol letter right))]
              [else (error "letter does not exist in tree")]))))
~~~

## Fun

I thought it'd be fun to see how large an encoded version of All-Star by Smashmouth. All that was needed was to find the character frequency distribution (which you can get by posting text in various helpful webapps), creating a Huffman Tree out of that character distribution, and transforming the lyrics into a list of symbols.

Here's all of that data:

~~~
(define allstar-alphabet
  '((A 114) (B 22) (C 29) (D 67) (E 175) (F 22) (G 74) (H 84) (I 83) (J 1) (K 21) (L 93) (M 38) (N 108) (O 163) (P 20) (R 91) (S 103) (T 165) (U 58) (V 7) (W 40) (Y 61)))

(define allstar-string "SOMEBODYONCETOLDMETHEWORLDISGONNAROLLMEIAINTTHESHARPESTTOOLINTHESHEDSHEWASLOOKINGKINDOFDUMBWITHHERFINGERANDHERTHUMBINTHESHAPEOFANLONHERFOREHEADWELLTHEYEARSSTARTCOMINGANDTHEYDONTSTOPCOMINGFEDTOTHERULESANDIHITTHEGROUNDRUNNINGDIDNTMAKESENSENOTTOLIVEFORFUNYOURBRAINGETSSMARTBUTYOURHEADGETSDUMBSOMUCHTODOSOMUCHTOSEESOWHATSWRONGWITHTAKINGTHEBACKSTREETSYOULLNEVERKNOWIFYOUDONTGOYOULLNEVERSHINEIFYOUDONTGLOWHEYNOWYOUREANALLSTARGETYOURGAMEONGOPLAYHEYNOWYOUREAROCKSTARGETTHESHOWONGETPAIDANDALLTHATGLITTERSISGOLDONLYSHOOTINGSTARSBREAKTHEMOLDITSACOOLPLACEANDTHEYSAYITGETSCOLDERYOUREBUNDLEDUPNOWWAITTILLYOUGETOLDERBUTTHEMETEORMENBEGTODIFFERJUDGINGBYTHEHOLEINTHESATELLITEPICTURETHEICEWESKATEISGETTINGPRETTYTHINTHEWATERSGETTINGWARMSOYOUMIGHTASWELLSWIMMYWORLDSONFIREHOWABOUTYOURSTHATSTHEWAYILIKEITANDINEVERGETBOREDHEYNOWYOUREANALLSTARGETYOURGAMEONGOPLAYHEYNOWYOUREAROCKSTARGETTHESHOWONGETPAIDALLTHATGLITTERSISGOLDONLYSHOOTINGSTARSBREAKTHEMOLDHEYNOWYOUREANALLSTARGETYOURGAMEONGOPLAYHEYNOWYOUREAROCKSTARGETTHESHOWONGETPAIDANDALLTHATGLITTERSISGOLDONLYSHOOTINGSTARSSOMEBODYONCEASKEDCOULDISPARESOMECHANGEFORGASINEEDTOGETMYSELFAWAYFROMTHISPLACEISAIDYEPWHATACONCEPTICOULDUSEALITTLEFUELMYSELFANDWECOULDALLUSEALITTLECHANGEWELLTHEYEARSSTARTCOMINGANDTHEYDONTSTOPCOMINGFEDTOTHERULESANDIHITTHEGROUNDRUNNINGDIDNTMAKESENSENOTTOLIVEFORFUNYOURBRAINGETSSMARTBUTYOURHEADGETSDUMBSOMUCHTODOSOMUCHTOSEESOWHATSWRONGWITHTAKINGTHEBACKSTREETSYOULLNEVERKNOWIFYOUDONTGOGOYOULLNEVERSHINEIFYOUDONTGLOWHEYNOWYOUREANALLSTARGETYOURGAMEONGOPLAYHEYNOWYOUREAROCKSTARGETTHESHOWONGETPAIDANDALLTHATGLITTERSISGOLDONLYSHOOTINGSTARSBREAKTHEMOLDANDALLTHATGLITTERSISGOLDONLYSHOOTINGSTARSBREAKTHEMOLD")

;; Map string to a list of symbols
(define allstar-song
  (map string->symbol
       (filter (λ (character) (not (string=? "" character)))
               (string-split allstar-string ""))))
(define allstar-tree (generate-huffman-tree allstar-alphabet))

;; 6872
(length (encode allstar-song allstar-tree))
~~~

### Serious Analysis Business

The resulting bitstring from encoding All-Star is 6872 bits for a 1639 character string. To contrast that with ASCII encoding, it would take 1639 * 8 bits per character or 13112 bits.

Amazing. What a day for science it has been.

I hope this wasn't too dumb, thanks for reading if you've made it all the way here.

## Full Source

Here's a GitHub Gist with the full source from all the examples.
[huffman.rkt](https://gist.github.com/copperwall/ff10f3c789c7f3405d83b0acbf18389c)
