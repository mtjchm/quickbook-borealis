import { BookingData } from "../types/index";
import { EmailClient } from "@azure/communication-email";
import dotenv from 'dotenv';
import { email } from "zod";
dotenv.config({ path: './.env.local' });


export async function sendBookingEmail(
    bookingData: BookingData
): Promise<void> {
    try {
        // Initialize the email client
        const emailClient = new EmailClient(process.env.AZURE_COMMUNICATION_CONNECTION_STRING || '');

        // Format dates for display
        const bookingDateFormatted = bookingData.bookingDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const startTimeFormatted = bookingData.startTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const endTimeFormatted = bookingData.endTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const emailSubject = `${bookingData.company.name} Booking Confirmation`;

        const emailBody =
            `
Dear ${bookingData.customer.firstName} ${bookingData.customer.lastName},

Thank you for your booking with ${bookingData.company.name}.

BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Booking ID: ${bookingData.id}
Company: ${bookingData.company.name}
Date: ${bookingDateFormatted}
Time: ${startTimeFormatted} - ${endTimeFormatted}
Status: ${bookingData.status.charAt(0).toUpperCase() + bookingData.status.slice(1)}
${bookingData.totalPrice ? `Total Price: $${bookingData.totalPrice}` : ''}
${bookingData.notes ? `\nNotes: ${bookingData.notes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We look forward to seeing you!

Best regards,
${bookingData.company.name}

---
This is an automated message. Please do not reply to this email.
    `.trim();
        const emailMessage = {
            senderAddress: process.env.AZURE_COMMUNICATION_EMAIL_SENDER || '',
            content: {
                subject: emailSubject,
                plainText: emailBody,
            },
            recipients: {
                to: [
                    {
                        address: bookingData.customer.email,
                        displayName: `${bookingData.customer.firstName} ${bookingData.customer.lastName}`,
                    },
                ],
            },
        };

        const poller = await emailClient.beginSend(emailMessage);
        const response = await poller.pollUntilDone();
    } catch (error) {
        console.error(error);
    }
}