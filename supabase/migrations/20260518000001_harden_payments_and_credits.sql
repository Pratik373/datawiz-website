-- Prevent payment replay from minting credits multiple times.
CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpay_order_id_key
  ON public.payments (razorpay_order_id);

CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpay_payment_id_key
  ON public.payments (razorpay_payment_id);

-- Atomically consume one test credit and return the remaining balance.
CREATE OR REPLACE FUNCTION public.consume_test_credit(target_user_id UUID)
RETURNS INT AS $$
DECLARE
  remaining INT;
BEGIN
  UPDATE public.user_credits
  SET
    tests_remaining = tests_remaining - 1,
    updated_at = timezone('utc'::text, now())
  WHERE user_id = target_user_id
    AND tests_remaining > 0
  RETURNING tests_remaining INTO remaining;

  RETURN remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
