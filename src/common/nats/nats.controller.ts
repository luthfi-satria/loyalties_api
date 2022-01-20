import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PromoBrandUsageService } from 'src/promo-brand-usage/promo-brand-usage.service';
import { PromoProviderUsageService } from 'src/promo-provider-usage/promo-provider-usage.service';
import { VoucherService } from 'src/voucher/voucher.service';

@Controller('')
export class NatsController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly promoProviderUsageService: PromoProviderUsageService,
    private readonly promoBrandUsageService: PromoBrandUsageService,
  ) {}
  logger = new Logger(NatsController.name);

  async usePromoProvider(@Payload() data: any) {
    this.promoProviderUsageService.usePromoProvider(data);
  }

  async usePromoBrand(@Payload() data: any) {
    this.promoBrandUsageService.usePromoBrand(data);
  }

  async useVoucher(@Payload() data: any) {
    this.voucherService.useVoucher(data);
  }

  @EventPattern('orders.order.created')
  async listenerPromoOrderCreated(@Payload() data: any) {
    this.logger.log('orders.order.created');
    this.usePromoProvider(data);
    this.usePromoBrand(data);
    this.useVoucher(data);
  }

  @EventPattern('orders.order.payment_cancelled')
  async listenerPromoPaymentCancelled(@Payload() data: any) {
    this.logger.log('orders.order.payment_cancelled');
    this.cancelPromoProvider(data);
    this.cancelPromoBrand(data);
    this.cancelVoucher(data);
  }

  @EventPattern('orders.order.cancelled_by_customer')
  async listenerPromoCancelledCustomer(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_customer');
    this.cancelPromoProvider(data);
    this.cancelPromoBrand(data);
    this.cancelVoucher(data);
  }

  @EventPattern('orders.order.cancelled_by_store.stocks')
  async listenerPromoCancelledStocks(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.stocks');
    this.cancelPromoProvider(data);
    this.cancelPromoBrand(data);
    this.cancelVoucher(data);
  }

  @EventPattern('orders.order.cancelled_by_store.operational')
  async listenerPromoCancelledOperational(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.operational');
    this.cancelPromoProvider(data);
    this.cancelPromoBrand(data);
    this.cancelVoucher(data);
  }

  @EventPattern('orders.order.cancelled_by_store.busy')
  async listenerPromoCancelledBusy(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.busy');
    this.cancelPromoProvider(data);
    this.cancelPromoBrand(data);
    this.cancelVoucher(data);
  }

  @EventPattern('orders.order.cancelled_by_store.other')
  async listenerPromoCancelledOther(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_store.other');
    this.cancelPromoProvider(data);
    this.cancelPromoBrand(data);
    this.cancelVoucher(data);
  }

  @EventPattern('orders.order.cancelled_by_system')
  async listenerPromoCancelledSystem(@Payload() data: any) {
    this.logger.log('orders.order.cancelled_by_system');
    this.cancelPromoProvider(data);
    this.cancelPromoBrand(data);
    this.cancelVoucher(data);
  }

  async cancelPromoProvider(data: any) {
    this.promoProviderUsageService.cancelPromoProvider(data);
  }

  async cancelPromoBrand(data: any) {
    this.promoBrandUsageService.cancelPromoBrand(data);
  }

  async cancelVoucher(data: any) {
    this.voucherService.cancelVoucher(data);
  }
}
