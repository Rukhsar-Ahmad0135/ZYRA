# TODO

## Fix Order id CastError (ObjectId)
- [ ] Identify incorrect route usage sending literal "id" to /api/orders/:id
- [ ] Update `Backend/routes/orderRoute.js` to validate `req.params.id` before calling `findById` and return 400 for invalid id
- [ ] Update router route order so `/my-orders` is declared before `/:id` (to avoid accidental matching)
- [ ] Add safe logging of `req.params.id`
- [ ] (Optional) Fix ES module type warning by aligning module system (add `"type": "module"` in backend/package.json) if desired

