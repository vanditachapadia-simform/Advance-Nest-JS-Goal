import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Idempotent seed: wipe ordered data, keep it simple for the demo.
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { id: 1, name: 'Demo Customer', role: 'customer' },
      { id: 2, name: 'Demo Admin', role: 'admin' },
    ],
  });

  await prisma.product.createMany({
    data: [
      { name: 'Mechanical Keyboard', priceCents: 9900, stock: 25 },
      { name: 'Wireless Mouse', priceCents: 4500, stock: 40 },
      { name: '4K Monitor', priceCents: 32000, stock: 10 },
      { name: 'USB-C Hub', priceCents: 5500, stock: 60 },
      { name: 'Laptop Stand', priceCents: 3500, stock: 100 },
    ],
  });

  console.log('Seed complete: 2 users, 5 products.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
