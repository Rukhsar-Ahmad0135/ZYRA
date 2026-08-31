import Product from "../models/Product.js";
import User from "../models/Users.js";
import Cart from "../models/Cart.js";
import products from "../data/products.js";

const seedInitialData = async () => {
    if (process.env.USE_LOCAL_DATA === "true") {
        return;
    }

    const productCount = await Product.countDocuments();
    if (productCount > 0) {
        return;
    }

    await Cart.deleteMany({});

    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
        adminUser = await User.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "Admin1234",
            role: "admin",
        });
    }

    const sampleProducts = products.map((product) => ({
        ...product,
        user: adminUser._id,
        isPublished: true,
        isFeatured: product.isFeatured || false,
    }));

    await Product.insertMany(sampleProducts);
    console.log(`Seeded ${sampleProducts.length} products`);
};

export default seedInitialData;