# Backend Fix TODO

- [x] Fix ProductRoutes.js routing conflicts /best-seller vs /best-sellers and duplicate handlers

- [ ] Remove broken duplicate routes ("This should not work") and extra router.get blocks
- [ ] Add alias route for /best-sellers (plural) to match frontend usage
- [ ] Make :id route validate ObjectId before calling findById to avoid CastError
- [x] Restart backend and test endpoints: /api/products/best-seller and /api/products/best-sellers


