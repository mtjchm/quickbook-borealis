import { createAdminUser, createCustomerUser, createProviderUser, createCompany, clear, disconnect } from "./dbtest";

async function main() {
    await clear();

    const admin = await createAdminUser(
        "admin@example.test",
        "Admin",
        "User",
        "$2a$08$9dH0bgabDNUksTWOyLFvbe3CcyQ59eIFQFkbYSa/iNx242VEmzrt2"
    );

    const provider = await createProviderUser(
        "owner@freshcuts.test",
        "Bob",
        "Owner",
        "$2a$08$9dH0bgabDNUksTWOyLFvbe3CcyQ59eIFQFkbYSa/iNx242VEmzrt2"
    );

    const provider2 = await createProviderUser(
        "spa.owner@test",
        "Sally",
        "Masseuse",
        "$2a$08$9dH0bgabDNUksTWOyLFvbe3CcyQ59eIFQFkbYSa/iNx242VEmzrt2"
    );

    const customer = await createCustomerUser(
        "alice.customer@test",
        "Alice",
        "Customer",
        "$2a$08$9dH0bgabDNUksTWOyLFvbe3CcyQ59eIFQFkbYSa/iNx242VEmzrt2"
    );


    const salon = await createCompany({
        name: "Fresh Cuts Salon",
        ownerId: provider.id,
        description: "Modern salon for stylish haircuts.",
        address: "123 Main St",
        phone: "555-1234",
        email: "contact@freshcuts.test",
        businessHours: { mon: { open: "09:00", close: "17:00" } },
        serviceName: "Haircut & Style",
    });

    const massage = await createCompany({
        name: "Relax Massage Studio",
        ownerId: provider2.id,
        description: "Relaxing massage therapy studio.",
        address: "456 Park Ave",
        phone: "555-5678",
        email: "info@relaxmassage.test",
        businessHours: { wed: { open: "10:00", close: "18:00" } },
        serviceName: "Full Body Massage",
    });

    await disconnect();
}

main().catch((err) => {
    console.log(err);
    process.exit(1);
});